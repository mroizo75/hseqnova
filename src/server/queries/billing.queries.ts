import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { getAddonPack, monthlyTotalGbp, type AddonPack } from "@/lib/billing-catalog";
import { getStripe } from "@/lib/stripe";
import { needsPaymentGate, parseSignupCheckoutMetadata } from "@/lib/signup-checkout";
import {
  coverageStillActive,
  isFailedRenewal,
  isPaidCancelPeriodExpired,
  isVoluntaryCancel,
  paidUntilFromInvoice,
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

function addDaysIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function loadStripePaidCoverage(input: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<{ until: number | null; source: StripePeriodSource | null }> {
  if (!input.stripeCustomerId && !input.stripeSubscriptionId) {
    return { until: null, source: null };
  }

  let source: StripePeriodSource | null = null;
  try {
    const stripe = getStripe();
    if (input.stripeSubscriptionId) {
      try {
        source = await stripe.subscriptions.retrieve(input.stripeSubscriptionId, {
          expand: ["items.data"],
        });
      } catch {
        source = null;
      }
    }
    if (!source && input.stripeCustomerId) {
      const list = await stripe.subscriptions.list({
        customer: input.stripeCustomerId,
        status: "all",
        limit: 10,
        expand: ["data.items.data"],
      });
      source =
        list.data.find((row) => row.status === "active" || row.status === "trialing") ??
        list.data.find((row) => isVoluntaryCancel(row) && shouldKeepAccessAfterCancel(row)) ??
        list.data[0] ??
        null;
    }

    let until = source ? stripePaidUntilUnix(source) : null;
    if (input.stripeCustomerId) {
      const invoices = await stripe.invoices.list({
        customer: input.stripeCustomerId,
        status: "paid",
        limit: 10,
        expand: ["data.lines"],
      });
      for (const invoice of invoices.data) {
        const invoiceUntil = paidUntilFromInvoice(invoice);
        if (invoiceUntil && (until === null || invoiceUntil > until)) {
          until = invoiceUntil;
        }
      }
    }
    return { until, source };
  } catch {
    return { until: source ? stripePaidUntilUnix(source) : null, source };
  }
}

export async function applyStripeSubscriptionAccess(input: {
  stripeCustomerId: string;
  subscription: StripePeriodSource & { id?: string };
}): Promise<void> {
  const db = getAdminDb();
  const { data: tenant, error } = await db
    .from("Tenant")
    .select("id, status, onboardingStatus, stripeSubscriptionId")
    .eq("stripeCustomerId", input.stripeCustomerId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant?.id) return;

  const coverage = await loadStripePaidCoverage({
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.subscription.id ?? (tenant.stripeSubscriptionId as string | null),
  });
  const source = coverage.source ?? input.subscription;
  const untilUnix = coverage.until ?? stripePaidUntilUnix(source);
  const keep =
    shouldKeepAccessAfterCancel(source) ||
    (isVoluntaryCancel(source) && coverageStillActive(untilUnix));

  const now = nowIso();
  const periodEnd = periodIsoFromUnix(untilUnix) ?? (keep ? addDaysIso(32) : null);
  const periodStart = periodIsoFromUnix(stripePeriodStartUnix(source));
  const subscriptionId = input.subscription.id ?? null;

  if (tenant.onboardingStatus === "NOT_STARTED" && keep) {
    const signup = parseSignupCheckoutMetadata(
      (source as { metadata?: Record<string, string> }).metadata,
    );
    await activatePaidSignup({
      tenantId: tenant.id,
      addonIds: signup?.addonIds ?? [],
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
    });
  } else if (tenant.onboardingStatus === "NOT_STARTED") {
    return;
  }

  if (keep) {
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

  const status = (source.status ?? "").toLowerCase();
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

export async function shouldSuspendOnPaymentFailed(input: {
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
}): Promise<boolean> {
  const coverage = await loadStripePaidCoverage(input);
  if (coverage.source && isVoluntaryCancel(coverage.source)) return false;
  if (coverage.source && isFailedRenewal(coverage.source)) return true;
  if (coverageStillActive(coverage.until) && coverage.source && isVoluntaryCancel(coverage.source)) {
    return false;
  }
  return true;
}

export type TenantProductAccess = "ok" | "pay" | "suspended";

export async function resolveTenantProductAccess(tenant: {
  id: string;
  status: string | null;
  onboardingStatus?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}): Promise<TenantProductAccess> {
  if (!needsPaymentGate(tenant) && tenant.status !== "SUSPENDED") {
    return "ok";
  }

  const db = getAdminDb();
  const { data: local } = await db
    .from("Subscription")
    .select("cancelAtPeriodEnd, currentPeriodEnd")
    .eq("tenantId", tenant.id)
    .maybeSingle();

  const coverage = await loadStripePaidCoverage({
    stripeCustomerId: tenant.stripeCustomerId,
    stripeSubscriptionId: tenant.stripeSubscriptionId,
  });

  const localState = local
    ? {
        cancelAtPeriodEnd: Boolean(local.cancelAtPeriodEnd),
        currentPeriodEnd: (local.currentPeriodEnd as string | null) ?? null,
      }
    : null;

  const paidNow =
    shouldRestoreSuspendedTenant(localState, coverage.source, Date.now(), coverage.until) ||
    (coverage.source?.status === "active" || coverage.source?.status === "trialing");

  if (needsPaymentGate(tenant)) {
    if (!paidNow) return "pay";
    const signup = parseSignupCheckoutMetadata(
      (coverage.source as { metadata?: Record<string, string> } | null)?.metadata,
    );
    await activatePaidSignup({
      tenantId: tenant.id,
      addonIds: signup?.addonIds ?? [],
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId ?? (coverage.source as { id?: string } | null)?.id,
    });
    if (coverage.source && isVoluntaryCancel(coverage.source)) {
      await syncLocalSubscriptionAccess(tenant.id, {
        cancelAtPeriodEnd: true,
        status: "ACTIVE",
        currentPeriodEnd: periodIsoFromUnix(coverage.until) ?? addDaysIso(32),
        currentPeriodStart: periodIsoFromUnix(coverage.source ? stripePeriodStartUnix(coverage.source) : null),
        stripeSubscriptionId: tenant.stripeSubscriptionId ?? null,
      });
    }
    return "ok";
  }

  if (tenant.status !== "SUSPENDED") return "ok";

  if (!shouldRestoreSuspendedTenant(localState, coverage.source, Date.now(), coverage.until)) {
    return "suspended";
  }

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
    currentPeriodEnd: periodIsoFromUnix(coverage.until) ?? localState?.currentPeriodEnd ?? addDaysIso(32),
    currentPeriodStart: coverage.source ? periodIsoFromUnix(stripePeriodStartUnix(coverage.source)) : null,
    stripeSubscriptionId: tenant.stripeSubscriptionId ?? null,
  });
  return "ok";
}
