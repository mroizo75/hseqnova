import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getAddonPack, monthlyTotalGbp, type AddonPack } from "@/lib/billing-catalog";
import { getStripe } from "@/lib/stripe";
import {
  isPaidCancelPeriodExpired,
  shouldKeepAccessAfterCancel,
  shouldRestoreSuspendedTenant,
  stripePaidUntilUnix,
  stripePeriodStartUnix,
  type StripePeriodSource,
} from "@/lib/stripe-subscription-access";

function nowIso(): string {
  return new Date().toISOString();
}

export async function loadEnabledBillingModuleKeys(tenantId: string): Promise<string[]> {
  const { data, error } = await getAdminDb()
    .from("TenantModule")
    .select("moduleKey, status, endsAt")
    .eq("tenantId", tenantId)
    .in("status", ["ACTIVE", "TRIAL", "PENDING_CANCEL"]);
  if (error) {
    throw { code: "MODULE_LOOKUP_FAILED", message: error.message };
  }
  const now = new Date().toISOString();
  return (data ?? [])
    .filter((row) => {
      if (row.status === "PENDING_CANCEL" && row.endsAt && row.endsAt < now) return false;
      return true;
    })
    .map((row) => String(row.moduleKey));
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

async function syncLocalSubscriptionAccess(
  tenantId: string,
  patch: {
    cancelAtPeriodEnd: boolean;
    status: "ACTIVE" | "CANCELLED";
    currentPeriodEnd?: string | null;
    currentPeriodStart?: string | null;
    stripeSubscriptionId?: string | null;
  },
): Promise<void> {
  const db = getAdminDb();
  const { data: existing, error: lookupError } = await db
    .from("Subscription")
    .select("id")
    .eq("tenantId", tenantId)
    .maybeSingle();
  if (lookupError) {
    throw { code: "SUBSCRIPTION_LOOKUP_FAILED", message: lookupError.message };
  }
  if (!existing?.id) return;

  const payload: Record<string, unknown> = {
    cancelAtPeriodEnd: patch.cancelAtPeriodEnd,
    status: patch.status,
    updatedAt: nowIso(),
  };
  if (patch.currentPeriodEnd) payload.currentPeriodEnd = patch.currentPeriodEnd;
  if (patch.currentPeriodStart) payload.currentPeriodStart = patch.currentPeriodStart;
  if (patch.stripeSubscriptionId) payload.stripeSubscriptionId = patch.stripeSubscriptionId;

  const { error } = await db.from("Subscription").update(payload).eq("id", existing.id);
  if (error) {
    throw { code: "SUBSCRIPTION_UPDATE_FAILED", message: error.message };
  }
}

function periodIsoFromUnix(unix: number | null): string | null {
  return unix ? new Date(unix * 1000).toISOString() : null;
}

export async function applyStripeSubscriptionAccess(input: {
  stripeCustomerId: string;
  subscription: StripePeriodSource & { id?: string };
}): Promise<void> {
  const db = getAdminDb();
  const { data: tenant, error } = await db
    .from("Tenant")
    .select("id, status, onboardingStatus")
    .eq("stripeCustomerId", input.stripeCustomerId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant?.id || tenant.onboardingStatus === "NOT_STARTED") return;

  const now = nowIso();
  const periodEnd = periodIsoFromUnix(stripePaidUntilUnix(input.subscription));
  const periodStart = periodIsoFromUnix(stripePeriodStartUnix(input.subscription));
  const subscriptionId = input.subscription.id ?? null;

  if (shouldKeepAccessAfterCancel(input.subscription)) {
    if (tenant.status === "SUSPENDED" || tenant.status === "TRIAL" || tenant.status === "ACTIVE") {
      const { error: tenantError } = await db
        .from("Tenant")
        .update({ status: "ACTIVE", suspendedAt: null, updatedAt: now })
        .eq("id", tenant.id)
        .neq("onboardingStatus", "NOT_STARTED");
      if (tenantError) {
        throw { code: "TENANT_UPDATE_FAILED", message: tenantError.message };
      }
    }
    await syncLocalSubscriptionAccess(tenant.id, {
      cancelAtPeriodEnd: true,
      status: "ACTIVE",
      currentPeriodEnd: periodEnd,
      currentPeriodStart: periodStart,
      stripeSubscriptionId: subscriptionId,
    });
    return;
  }

  const status = (input.subscription.status ?? "").toLowerCase();
  const cancelled = status === "canceled" || status === "cancelled";
  if (!cancelled) return;

  const { error: suspendError } = await db
    .from("Tenant")
    .update({ status: "SUSPENDED", suspendedAt: now, updatedAt: now })
    .eq("id", tenant.id)
    .in("status", ["ACTIVE", "TRIAL"])
    .neq("onboardingStatus", "NOT_STARTED");
  if (suspendError) {
    throw { code: "TENANT_UPDATE_FAILED", message: suspendError.message };
  }
  await syncLocalSubscriptionAccess(tenant.id, {
    cancelAtPeriodEnd: true,
    status: "CANCELLED",
    currentPeriodEnd: periodEnd,
    currentPeriodStart: periodStart,
    stripeSubscriptionId: subscriptionId,
  });
}

export async function syncLiveStripeSubscription(input: {
  stripeCustomerId: string;
  subscriptionId: string;
  subscription: StripePeriodSource;
}): Promise<void> {
  const db = getAdminDb();
  const { data: tenant, error } = await db
    .from("Tenant")
    .select("id")
    .eq("stripeCustomerId", input.stripeCustomerId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant?.id) return;

  await syncLocalSubscriptionAccess(tenant.id, {
    cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
    status: "ACTIVE",
    currentPeriodEnd: periodIsoFromUnix(stripePaidUntilUnix(input.subscription)),
    currentPeriodStart: periodIsoFromUnix(stripePeriodStartUnix(input.subscription)),
    stripeSubscriptionId: input.subscriptionId,
  });
}

export async function suspendExpiredCancelledSubscriptions(): Promise<number> {
  const db = getAdminDb();
  const now = nowIso();
  const { data: rows, error } = await db
    .from("Subscription")
    .select("id, tenantId, cancelAtPeriodEnd, currentPeriodEnd")
    .eq("cancelAtPeriodEnd", true)
    .lte("currentPeriodEnd", now);
  if (error) {
    throw { code: "SUBSCRIPTION_LOOKUP_FAILED", message: error.message };
  }

  let ended = 0;
  for (const row of rows ?? []) {
    if (
      !isPaidCancelPeriodExpired({
        cancelAtPeriodEnd: Boolean(row.cancelAtPeriodEnd),
        currentPeriodEnd: (row.currentPeriodEnd as string | null) ?? null,
      })
    ) {
      continue;
    }
    const { error: tenantError } = await db
      .from("Tenant")
      .update({ status: "SUSPENDED", suspendedAt: now, updatedAt: now })
      .eq("id", row.tenantId)
      .in("status", ["ACTIVE", "TRIAL"]);
    if (tenantError) {
      throw { code: "TENANT_UPDATE_FAILED", message: tenantError.message };
    }
    const { error: subError } = await db
      .from("Subscription")
      .update({ status: "CANCELLED", updatedAt: now })
      .eq("id", row.id);
    if (subError) {
      throw { code: "SUBSCRIPTION_UPDATE_FAILED", message: subError.message };
    }
    ended += 1;
  }
  return ended;
}

export async function ensureTenantPaidAccess(tenant: {
  id: string;
  status: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<boolean> {
  if (tenant.status !== "SUSPENDED") return true;

  const db = getAdminDb();
  const { data: local } = await db
    .from("Subscription")
    .select("cancelAtPeriodEnd, currentPeriodEnd")
    .eq("tenantId", tenant.id)
    .maybeSingle();

  let stripe: StripePeriodSource | null = null;
  if (tenant.stripeSubscriptionId) {
    try {
      stripe = await getStripe().subscriptions.retrieve(tenant.stripeSubscriptionId);
    } catch {
      stripe = null;
    }
  }

  const localState = local
    ? {
        cancelAtPeriodEnd: Boolean(local.cancelAtPeriodEnd),
        currentPeriodEnd: (local.currentPeriodEnd as string | null) ?? null,
      }
    : null;

  if (!shouldRestoreSuspendedTenant(localState, stripe)) return false;

  const now = nowIso();
  const { error } = await db
    .from("Tenant")
    .update({ status: "ACTIVE", suspendedAt: null, updatedAt: now })
    .eq("id", tenant.id)
    .eq("status", "SUSPENDED");
  if (error) {
    throw { code: "TENANT_UPDATE_FAILED", message: error.message };
  }
  await syncLocalSubscriptionAccess(tenant.id, {
    cancelAtPeriodEnd: true,
    status: "ACTIVE",
    currentPeriodEnd: stripe ? periodIsoFromUnix(stripePaidUntilUnix(stripe)) : localState?.currentPeriodEnd,
    currentPeriodStart: stripe ? periodIsoFromUnix(stripePeriodStartUnix(stripe)) : null,
    stripeSubscriptionId: tenant.stripeSubscriptionId ?? null,
  });
  return true;
}
