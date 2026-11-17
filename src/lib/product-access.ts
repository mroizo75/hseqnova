import { isDemoRegistration } from "@/lib/demo-access";

export type ProductAccess = "ok" | "pay" | "suspended";

export type ProductAccessTenant = {
  status?: string | null;
  registrationType?: string | null;
  trialEndsAt?: string | Date | null;
};

export type PaymentSnapshot = {
  stripeStatus?: string | null;
  paidUntilUnix?: number | null;
  cancelAtPeriodEnd?: boolean | null;
};

const UNPAID_STRIPE_STATUSES = new Set([
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "trialing",
]);

export function isOpenDemo(tenant: ProductAccessTenant, nowMs = Date.now()): boolean {
  if (!isDemoRegistration(tenant.registrationType)) return false;
  if (tenant.status === "CANCELLED" || tenant.status === "SUSPENDED") return false;
  if (!tenant.trialEndsAt) return false;
  return new Date(tenant.trialEndsAt).getTime() > nowMs;
}

export function hasCurrentPayment(payment: PaymentSnapshot, nowMs = Date.now()): boolean {
  const status = (payment.stripeStatus ?? "").toLowerCase();
  if (UNPAID_STRIPE_STATUSES.has(status)) return false;
  const covered = payment.paidUntilUnix != null && payment.paidUntilUnix * 1000 > nowMs;
  if (status === "active") return true;
  if (status === "canceled" || status === "cancelled" || payment.cancelAtPeriodEnd) {
    return covered;
  }
  return covered;
}

export function decideProductAccess(
  tenant: ProductAccessTenant,
  payment: PaymentSnapshot,
  nowMs = Date.now(),
): ProductAccess {
  if (tenant.status === "CANCELLED") return "suspended";
  if (isOpenDemo(tenant, nowMs)) return "ok";
  if (!hasCurrentPayment(payment, nowMs)) return "pay";
  if (tenant.status === "SUSPENDED") return "suspended";
  return "ok";
}

export type BillingMark = "paid" | "unpaid" | "demo";

export function billingMark(tenant: ProductAccessTenant, payment: PaymentSnapshot, nowMs = Date.now()): BillingMark {
  if (isOpenDemo(tenant, nowMs)) return "demo";
  return hasCurrentPayment(payment, nowMs) ? "paid" : "unpaid";
}
