"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeOrganisations } from "@/lib/platform-access";
import { getAdminDb } from "@/lib/supabase/admin";
import {
  catalogStripePriceEnv,
  getAddonPack,
  isAddonPackActive,
  packStripePriceIds,
  stripePriceIdFromEnv,
  type BillingInterval,
} from "@/lib/billing-catalog";
import {
  activateAddonPackForTenant,
  cancelAddonPackImmediately,
  loadEnabledBillingModuleKeys,
  markAddonPackEnding,
  upsertSubscriptionTotal,
} from "@/server/queries/billing.queries";

const grantSchema = z.object({
  tenantId: z.string().min(1),
  packId: z.string().min(1),
  trialMonths: z.number().int().min(0).max(12),
});

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function requireOrgStaff() {
  const staff = await requirePlatformStaff();
  if (!staff || !canSeeOrganisations(staff)) {
    throw { code: "FORBIDDEN", message: "Only platform staff can change company add-ons" };
  }
  return staff;
}

async function subscriptionBillingInterval(subscriptionId: string): Promise<BillingInterval> {
  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === "year" ? "year" : "month";
}

export async function grantTenantAddonPack(input: {
  tenantId: string;
  packId: string;
  trialMonths: number;
}) {
  try {
    await requireOrgStaff();
    const validated = grantSchema.parse(input);
    const pack = getAddonPack(validated.packId);
    if (!pack) {
      return { success: false as const, error: "Unknown add-on pack" };
    }

    const enabled = await loadEnabledBillingModuleKeys(validated.tenantId);
    if (isAddonPackActive(enabled, pack)) {
      return { success: false as const, error: `${pack.name} is already active for this company` };
    }

    const { data: tenant, error } = await getAdminDb()
      .from("Tenant")
      .select("id, stripeSubscriptionId, stripeCustomerId")
      .eq("id", validated.tenantId)
      .maybeSingle();
    if (error) {
      throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
    }
    if (!tenant) {
      return { success: false as const, error: "Company not found" };
    }
    if (!tenant.stripeSubscriptionId || !tenant.stripeCustomerId) {
      return {
        success: false as const,
        error:
          "This company has no Stripe subscription yet. They must complete checkout before you can grant a pack that converts to paid.",
      };
    }

    const interval = await subscriptionBillingInterval(tenant.stripeSubscriptionId as string);
    const grantInterval: BillingInterval = validated.trialMonths > 0 ? "month" : interval;
    const priceId = stripePriceIdFromEnv(catalogStripePriceEnv(pack, grantInterval));
    if (!priceId) {
      return {
        success: false as const,
        error: "Stripe prices are not configured for this billing interval.",
      };
    }

    const { grantAddonOnStripe } = await import("@/lib/stripe-billing");
    const stripeGrant = await grantAddonOnStripe({
      customerId: tenant.stripeCustomerId as string,
      subscriptionId: tenant.stripeSubscriptionId as string,
      priceId,
      tenantId: validated.tenantId,
      packId: pack.id,
      trialMonths: validated.trialMonths,
    });

    await activateAddonPackForTenant({
      tenantId: validated.tenantId,
      packId: pack.id,
      stripePriceId: priceId,
      status: validated.trialMonths > 0 ? "TRIAL" : "ACTIVE",
      endsAt: stripeGrant.trialEndsAt,
    });

    const nextKeys = await loadEnabledBillingModuleKeys(validated.tenantId);
    const price = await upsertSubscriptionTotal(validated.tenantId, nextKeys, interval);

    revalidatePath(`/admin/tenants/${validated.tenantId}`);
    revalidatePath("/admin/tenants");
    revalidatePath("/dashboard");
    return {
      success: true as const,
      price,
      trialEndsAt: stripeGrant.trialEndsAt,
    };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not grant the add-on") };
  }
}

export async function revokeTenantAddonPack(input: { tenantId: string; packId: string }) {
  try {
    await requireOrgStaff();
    const pack = getAddonPack(input.packId);
    if (!pack) {
      return { success: false as const, error: "Unknown add-on pack" };
    }

    const enabled = await loadEnabledBillingModuleKeys(input.tenantId);
    if (!isAddonPackActive(enabled, pack)) {
      return { success: false as const, error: `${pack.name} is not active for this company` };
    }

    const { data: tenant, error } = await getAdminDb()
      .from("Tenant")
      .select("id, stripeSubscriptionId, stripeCustomerId")
      .eq("id", input.tenantId)
      .maybeSingle();
    if (error) {
      throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
    }
    if (!tenant) {
      return { success: false as const, error: "Company not found" };
    }

    let endsAt = new Date().toISOString();
    if (tenant.stripeCustomerId) {
      const { revokeAdminGrantedAddonOnStripe } = await import("@/lib/stripe-billing");
      const revoked = await revokeAdminGrantedAddonOnStripe({
        customerId: tenant.stripeCustomerId as string,
        packId: pack.id,
        priceIds: packStripePriceIds(pack),
        mainSubscriptionId: (tenant.stripeSubscriptionId as string | null) ?? null,
      });
      endsAt = revoked.endsAt;
    }

    const immediate = endsAt <= new Date().toISOString();
    if (immediate) {
      await cancelAddonPackImmediately({ tenantId: input.tenantId, packId: pack.id });
    } else {
      await markAddonPackEnding({ tenantId: input.tenantId, packId: pack.id, endsAt });
    }

    const nextKeys = await loadEnabledBillingModuleKeys(input.tenantId);
    const interval: BillingInterval = tenant.stripeSubscriptionId
      ? await subscriptionBillingInterval(tenant.stripeSubscriptionId as string)
      : "month";
    const price = await upsertSubscriptionTotal(input.tenantId, nextKeys, interval);

    revalidatePath(`/admin/tenants/${input.tenantId}`);
    revalidatePath("/admin/tenants");
    revalidatePath("/dashboard");
    return { success: true as const, price, endsAt };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not revoke the add-on") };
  }
}
