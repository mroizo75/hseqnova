"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAddonPack, isAddonPackActive, stripePriceIdFromEnv, ADDON_PACKS } from "@/lib/billing-catalog";
import {
  activateAddonPackForTenant,
  loadEnabledBillingModuleKeys,
  upsertSubscriptionTotal,
} from "@/server/queries/billing.queries";

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function requireAdminTenant() {
  const auth = await getAuthContext();
  if (!auth) {
    throw { code: "UNAUTHENTICATED", message: "Not authenticated" };
  }
  if (auth.role !== "ADMIN") {
    throw { code: "FORBIDDEN", message: "Only administrators can change billing" };
  }
  return auth;
}

export async function addAddonToSubscription(packId: string) {
  try {
    const auth = await requireAdminTenant();
    const pack = getAddonPack(packId);
    if (!pack) {
      return { success: false as const, error: "Unknown add-on pack" };
    }

    const enabled = await loadEnabledBillingModuleKeys(auth.tenantId);
    if (isAddonPackActive(enabled, pack)) {
      return { success: false as const, error: `${pack.name} is already on this subscription` };
    }

    const priceId = stripePriceIdFromEnv(pack.stripePriceEnv);
    await activateAddonPackForTenant({
      tenantId: auth.tenantId,
      packId: pack.id,
      stripePriceId: priceId,
    });

    const nextKeys = await loadEnabledBillingModuleKeys(auth.tenantId);
    const price = await upsertSubscriptionTotal(auth.tenantId, nextKeys);

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("stripeSubscriptionId")
      .eq("id", auth.tenantId)
      .maybeSingle();

    if (tenant?.stripeSubscriptionId && priceId) {
      const { addPriceToExistingSubscription } = await import("@/lib/stripe-billing");
      await addPriceToExistingSubscription({
        subscriptionId: tenant.stripeSubscriptionId as string,
        priceId,
      });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true as const, price };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not add the add-on to the subscription") };
  }
}

export async function removeAddonFromSubscription(packId: string) {
  try {
    const auth = await requireAdminTenant();
    const pack = getAddonPack(packId);
    if (!pack) {
      return { success: false as const, error: "Unknown add-on pack" };
    }

    const enabled = await loadEnabledBillingModuleKeys(auth.tenantId);
    if (!isAddonPackActive(enabled, pack)) {
      return { success: false as const, error: `${pack.name} is not on this subscription` };
    }

    const db = getAdminDb();
    const now = new Date().toISOString();

    // Find current period end from Stripe so access stays until paid period expires
    const { data: tenant } = await db
      .from("Tenant")
      .select("stripeSubscriptionId")
      .eq("id", auth.tenantId)
      .maybeSingle();

    let periodEnd: string = now;
    const priceId = stripePriceIdFromEnv(pack.stripePriceEnv);

    if (tenant?.stripeSubscriptionId) {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId as string) as unknown as {
        current_period_end: number;
        items: { data: Array<{ id: string; price: { id: string } }> };
      };

      // Keep access until the end of the current billing period
      periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      // Remove the item from Stripe with no proration — they paid for this month already
      if (priceId) {
        const item = subscription.items.data.find((si) => si.price.id === priceId);
        if (item) {
          await stripe.subscriptionItems.del(item.id, { proration_behavior: "none" });
        }
      }
    }

    // Mark modules as ending at period end (not immediately)
    for (const moduleKey of pack.moduleKeys) {
      await db
        .from("TenantModule")
        .update({ status: "PENDING_CANCEL", endsAt: periodEnd, updatedAt: now })
        .eq("tenantId", auth.tenantId)
        .eq("moduleKey", moduleKey);
    }

    const nextKeys = await loadEnabledBillingModuleKeys(auth.tenantId);
    const price = await upsertSubscriptionTotal(auth.tenantId, nextKeys);

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true as const, price, endsAt: periodEnd };
  } catch (error: unknown) {
    return { success: false as const, error: errorMessage(error, "Could not remove the add-on") };
  }
}
