import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getAddonPack, monthlyTotalGbp, type AddonPack } from "@/lib/billing-catalog";

function nowIso(): string {
  return new Date().toISOString();
}

export async function loadEnabledBillingModuleKeys(tenantId: string): Promise<string[]> {
  const { data, error } = await getAdminDb()
    .from("TenantModule")
    .select("moduleKey")
    .eq("tenantId", tenantId)
    .in("status", ["ACTIVE", "TRIAL"]);
  if (error) {
    throw { code: "MODULE_LOOKUP_FAILED", message: error.message };
  }
  return (data ?? []).map((row) => String(row.moduleKey));
}

async function upsertTenantModule(input: {
  tenantId: string;
  moduleKey: string;
  stripePriceId?: string | null;
}): Promise<void> {
  const db = getAdminDb();
  const { data: existing, error: lookupError } = await db
    .from("TenantModule")
    .select("id")
    .eq("tenantId", input.tenantId)
    .eq("moduleKey", input.moduleKey)
    .maybeSingle();
  if (lookupError) {
    throw { code: "MODULE_LOOKUP_FAILED", message: lookupError.message };
  }

  const now = nowIso();
  if (existing?.id) {
    const { error } = await db
      .from("TenantModule")
      .update({
        status: "ACTIVE",
        stripePriceId: input.stripePriceId ?? null,
        endsAt: null,
        updatedAt: now,
      })
      .eq("id", existing.id);
    if (error) {
      throw { code: "MODULE_UPDATE_FAILED", message: error.message };
    }
    return;
  }

  const { error } = await db.from("TenantModule").insert({
    id: createId(),
    tenantId: input.tenantId,
    moduleKey: input.moduleKey,
    status: "ACTIVE",
    stripePriceId: input.stripePriceId ?? null,
    startsAt: now,
    endsAt: null,
    createdAt: now,
    updatedAt: now,
  });
  if (error) {
    throw { code: "MODULE_CREATE_FAILED", message: error.message };
  }
}

async function activateSafetyBoardSubscription(tenantId: string, pricePerMonth: number): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();
  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 1);

  const { data: existing, error: lookupError } = await db
    .from("HmsTavleSubscription")
    .select("id")
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (lookupError) {
    throw { code: "TAVLE_SUB_LOOKUP_FAILED", message: lookupError.message };
  }

  if (existing?.id) {
    const { error } = await db
      .from("HmsTavleSubscription")
      .update({
        plan: "ADDON",
        status: "ACTIVE",
        isAddon: true,
        pricePerMonth,
        endsAt: endsAt.toISOString(),
        autoRenew: true,
        maxTavler: 999,
        updatedAt: now,
      })
      .eq("id", existing.id);
    if (error) {
      throw { code: "TAVLE_SUB_UPDATE_FAILED", message: error.message };
    }
    return;
  }

  const { error } = await db.from("HmsTavleSubscription").insert({
    id: createId(),
    tenantId,
    plan: "ADDON",
    status: "ACTIVE",
    isAddon: true,
    pricePerMonth,
    startsAt: now,
    endsAt: endsAt.toISOString(),
    autoRenew: true,
    maxTavler: 999,
    createdAt: now,
    updatedAt: now,
  });
  if (error) {
    throw { code: "TAVLE_SUB_CREATE_FAILED", message: error.message };
  }
}

export async function activateAddonPackForTenant(input: {
  tenantId: string;
  packId: string;
  stripePriceId?: string | null;
}): Promise<AddonPack> {
  const pack = getAddonPack(input.packId);
  if (!pack) {
    throw { code: "UNKNOWN_ADDON", message: "Unknown add-on pack" };
  }

  for (const moduleKey of pack.moduleKeys) {
    await upsertTenantModule({
      tenantId: input.tenantId,
      moduleKey,
      stripePriceId: input.stripePriceId,
    });
  }

  if (pack.id === "safety-board") {
    await activateSafetyBoardSubscription(input.tenantId, pack.monthlyPriceGbp);
  }

  return pack;
}

export async function upsertSubscriptionTotal(tenantId: string, enabledKeys: Iterable<string>): Promise<number> {
  const price = monthlyTotalGbp(enabledKeys);
  const now = nowIso();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existing, error: lookupError } = await getAdminDb()
    .from("Subscription")
    .select("id")
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (lookupError) {
    throw { code: "SUBSCRIPTION_LOOKUP_FAILED", message: lookupError.message };
  }

  if (existing?.id) {
    const { error } = await getAdminDb()
      .from("Subscription")
      .update({ price, updatedAt: now })
      .eq("id", existing.id);
    if (error) {
      throw { code: "SUBSCRIPTION_UPDATE_FAILED", message: error.message };
    }
    return price;
  }

  const { error } = await getAdminDb().from("Subscription").insert({
    id: createId(),
    tenantId,
    plan: "STARTER",
    status: "ACTIVE",
    price,
    billingInterval: "MONTHLY",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });
  if (error) {
    throw { code: "SUBSCRIPTION_CREATE_FAILED", message: error.message };
  }
  return price;
}

export async function activatePaidSignup(input: {
  tenantId: string;
  addonIds: Iterable<string>;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<void> {
  const now = nowIso();
  const tenantUpdate: Record<string, unknown> = {
    status: "ACTIVE",
    onboardingStatus: "COMPLETED",
    onboardingCompletedAt: now,
    updatedAt: now,
  };
  if (input.stripeCustomerId) {
    tenantUpdate.stripeCustomerId = input.stripeCustomerId;
  }
  if (input.stripeSubscriptionId) {
    tenantUpdate.stripeSubscriptionId = input.stripeSubscriptionId;
  }

  const { error } = await getAdminDb()
    .from("Tenant")
    .update(tenantUpdate)
    .eq("id", input.tenantId);
  if (error) {
    throw { code: "SIGNUP_TENANT_UPDATE_FAILED", message: error.message };
  }

  for (const packId of input.addonIds) {
    await activateAddonPackForTenant({ tenantId: input.tenantId, packId });
  }

  const enabled = await loadEnabledBillingModuleKeys(input.tenantId);
  await upsertSubscriptionTotal(input.tenantId, enabled);
}
