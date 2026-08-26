import { getStripe, UK_VAT_PERCENT, DEFAULT_CURRENCY } from "@/lib/stripe";
import { getAdminDb } from "@/lib/supabase/admin";

export async function createOrGetStripeCustomer(tenantId: string): Promise<string> {
  const { data: tenant, error } = await getAdminDb()
    .from("Tenant")
    .select("id, name, contactEmail, invoiceEmail, vatNumber, purchaseOrderNumber, stripeCustomerId")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant) {
    throw { code: "TENANT_NOT_FOUND", message: "Company not found" };
  }
  if (tenant.stripeCustomerId) {
    return tenant.stripeCustomerId as string;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenant.name as string,
    email: (tenant.invoiceEmail as string | null) || (tenant.contactEmail as string | null) || undefined,
    metadata: { tenantId: tenant.id as string },
    tax_exempt: "none",
  });

  const { error: updateError } = await getAdminDb()
    .from("Tenant")
    .update({ stripeCustomerId: customer.id, updatedAt: new Date().toISOString() })
    .eq("id", tenantId);
  if (updateError) {
    throw { code: "TENANT_UPDATE_FAILED", message: updateError.message };
  }
  return customer.id;
}

export async function createCheckoutSession(input: {
  tenantId: string;
  priceIds: string[];
  billingMethod: "INVOICE" | "DIRECT_DEBIT" | "CARD";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string }> {
  const customerId = await createOrGetStripeCustomer(input.tenantId);
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: input.priceIds.map((price) => ({ price, quantity: 1 })),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    automatic_tax: { enabled: true },
    metadata: { tenantId: input.tenantId, vatPercent: String(UK_VAT_PERCENT), ...input.metadata },
    subscription_data: {
      metadata: { tenantId: input.tenantId, ...input.metadata },
    },
    currency: DEFAULT_CURRENCY,
  });

  if (!session.url) {
    throw { code: "STRIPE_CHECKOUT_FAILED", message: "Could not create Stripe Checkout session" };
  }
  return { url: session.url };
}

export async function addPriceToExistingSubscription(input: {
  subscriptionId: string;
  priceId: string;
}): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptionItems.create({
    subscription: input.subscriptionId,
    price: input.priceId,
    proration_behavior: "create_prorations",
  });
}

export async function createBillingPortalSession(input: {
  tenantId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const { data: tenant, error } = await getAdminDb()
    .from("Tenant")
    .select("stripeCustomerId")
    .eq("id", input.tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant?.stripeCustomerId) {
    throw {
      code: "STRIPE_CUSTOMER_MISSING",
      message: "No Stripe customer is linked to this company yet",
    };
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId as string,
    return_url: input.returnUrl,
  });
  if (!session.url) {
    throw { code: "STRIPE_PORTAL_FAILED", message: "Could not open the billing portal" };
  }
  return { url: session.url };
}

export async function loadPaidCheckoutSession(sessionId: string): Promise<{
  tenantId: string;
  packId: string;
  priceId: string | null;
}> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });
  if (session.payment_status !== "paid" && session.status !== "complete") {
    throw { code: "CHECKOUT_UNPAID", message: "This checkout is not paid yet" };
  }
  const tenantId = session.metadata?.tenantId;
  const packId = session.metadata?.packId;
  if (!tenantId || !packId) {
    throw { code: "CHECKOUT_METADATA_MISSING", message: "Checkout session is missing pack details" };
  }
  const priceId = session.line_items?.data[0]?.price?.id ?? null;
  return { tenantId, packId, priceId };
}
