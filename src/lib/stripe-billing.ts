import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/supabase/admin";
import { stripePaidUntilUnix } from "@/lib/stripe-subscription-access";

function gbVatValue(raw: string): string {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  return compact.startsWith("GB") ? compact : `GB${compact}`;
}

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

  const stripe = getStripe();
  let customerId = (tenant.stripeCustomerId as string | null) ?? null;

  if (customerId) {
    await stripe.customers.update(customerId, { tax_exempt: "reverse" });
  } else {
    const customer = await stripe.customers.create({
      name: tenant.name as string,
      email: (tenant.invoiceEmail as string | null) || (tenant.contactEmail as string | null) || undefined,
      metadata: { tenantId: tenant.id as string },
      // B2B: Stripe Tax reverse charge, not B2C UK VAT.
      tax_exempt: "reverse",
    });
    customerId = customer.id;
    const { error: updateError } = await getAdminDb()
      .from("Tenant")
      .update({ stripeCustomerId: customerId, updatedAt: new Date().toISOString() })
      .eq("id", tenantId);
    if (updateError) {
      throw { code: "TENANT_UPDATE_FAILED", message: updateError.message };
    }
  }

  const vatNumber = typeof tenant.vatNumber === "string" ? tenant.vatNumber.trim() : "";
  if (vatNumber) {
    try {
      await stripe.customers.createTaxId(customerId, {
        type: "gb_vat",
        value: gbVatValue(vatNumber),
      });
    } catch {
      // Already on the customer, or format rejected — Checkout can still collect it.
    }
  }

  return customerId;
}

export async function createCheckoutSession(input: {
  tenantId: string;
  priceIds: string[];
  billingMethod: "INVOICE" | "DIRECT_DEBIT" | "CARD";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string }> {
  const stripe = getStripe();

  const openSession = async (customerId: string) => {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: input.priceIds.map((price) => ({ price, quantity: 1 })),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      metadata: { tenantId: input.tenantId, ...input.metadata },
      subscription_data: {
        metadata: { tenantId: input.tenantId, ...input.metadata },
      },
      ...(input.billingMethod === "DIRECT_DEBIT"
        ? { payment_method_types: ["bacs_debit"] as const }
        : {}),
    });
    if (!session.url) {
      throw { code: "STRIPE_CHECKOUT_FAILED", message: "Could not create Stripe Checkout session" };
    }
    return { url: session.url };
  };

  try {
    return await openSession(await createOrGetStripeCustomer(input.tenantId));
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "";
    if (!/no such customer/i.test(message)) {
      throw error;
    }
    const { error: clearError } = await getAdminDb()
      .from("Tenant")
      .update({ stripeCustomerId: null, updatedAt: new Date().toISOString() })
      .eq("id", input.tenantId);
    if (clearError) {
      throw { code: "TENANT_UPDATE_FAILED", message: clearError.message };
    }
    return openSession(await createOrGetStripeCustomer(input.tenantId));
  }
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

export const ADMIN_ADDON_GRANT_META = "1";

export function isAdminAddonGrantSubscription(metadata: Record<string, string> | null | undefined): boolean {
  return metadata?.admin_addon_grant === ADMIN_ADDON_GRANT_META;
}

function paymentMethodIdFromSubscription(subscription: {
  default_payment_method?: string | { id: string } | null;
}): string | null {
  const method = subscription.default_payment_method;
  if (!method) return null;
  return typeof method === "string" ? method : method.id;
}

export async function grantAddonOnStripe(input: {
  customerId: string;
  subscriptionId: string;
  priceId: string;
  tenantId: string;
  packId: string;
  trialMonths: number;
}): Promise<{ stripeSubscriptionId: string; trialEndsAt: string | null }> {
  const stripe = getStripe();

  if (input.trialMonths <= 0) {
    await addPriceToExistingSubscription({
      subscriptionId: input.subscriptionId,
      priceId: input.priceId,
    });
    return { stripeSubscriptionId: input.subscriptionId, trialEndsAt: null };
  }

  const parent = await stripe.subscriptions.retrieve(input.subscriptionId, {
    expand: ["default_payment_method"],
  });
  let paymentMethodId = paymentMethodIdFromSubscription(parent);
  if (!paymentMethodId) {
    const customer = await stripe.customers.retrieve(input.customerId);
    if (!("invoice_settings" in customer)) {
      throw {
        code: "STRIPE_CUSTOMER_MISSING",
        message: "Stripe customer is missing. The company must complete checkout first.",
      };
    }
    const invoicePm = customer.invoice_settings?.default_payment_method;
    paymentMethodId =
      typeof invoicePm === "string" ? invoicePm : invoicePm && "id" in invoicePm ? invoicePm.id : null;
  }
  if (!paymentMethodId) {
    throw {
      code: "NO_PAYMENT_METHOD",
      message:
        "This company has no card or Direct Debit on file in Stripe. They must complete checkout before a trial can convert to paid.",
    };
  }

  const trialEnd = new Date();
  trialEnd.setMonth(trialEnd.getMonth() + input.trialMonths);

  const created = await stripe.subscriptions.create({
    customer: input.customerId,
    items: [{ price: input.priceId }],
    trial_end: Math.floor(trialEnd.getTime() / 1000),
    default_payment_method: paymentMethodId,
    collection_method: parent.collection_method,
    automatic_tax: { enabled: true },
    metadata: {
      tenantId: input.tenantId,
      packId: input.packId,
      admin_addon_grant: ADMIN_ADDON_GRANT_META,
    },
  });

  return {
    stripeSubscriptionId: created.id,
    trialEndsAt: new Date(trialEnd).toISOString(),
  };
}

export async function revokeAdminGrantedAddonOnStripe(input: {
  customerId: string;
  packId: string;
  priceIds: string[];
  mainSubscriptionId?: string | null;
}): Promise<{ endsAt: string }> {
  const stripe = getStripe();
  const nowIso = new Date().toISOString();
  const list = await stripe.subscriptions.list({
    customer: input.customerId,
    status: "all",
    limit: 20,
  });

  const grant = list.data.find(
    (row) =>
      isAdminAddonGrantSubscription(row.metadata) &&
      row.metadata?.packId === input.packId &&
      (row.status === "trialing" || row.status === "active"),
  );

  if (grant) {
    if (grant.status === "trialing") {
      await stripe.subscriptions.cancel(grant.id);
      return { endsAt: nowIso };
    }
    const updated = await stripe.subscriptions.update(grant.id, {
      cancel_at_period_end: true,
      expand: ["items.data"],
    });
    const until = stripePaidUntilUnix(updated);
    return { endsAt: until ? new Date(until * 1000).toISOString() : nowIso };
  }

  if (input.mainSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(input.mainSubscriptionId, {
      expand: ["items.data"],
    });
    const item = subscription.items.data.find((si) => input.priceIds.includes(si.price.id));
    if (item) {
      await stripe.subscriptionItems.del(item.id, { proration_behavior: "none" });
    }
    const until = stripePaidUntilUnix(subscription);
    return { endsAt: until ? new Date(until * 1000).toISOString() : nowIso };
  }

  return { endsAt: nowIso };
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
  let configuration: string | undefined;
  try {
    const configs = await stripe.billingPortal.configurations.list({ limit: 10 });
    const current = configs.data.find((row) => row.is_default) ?? configs.data[0];
    if (current) {
      if (current.features.subscription_cancel?.mode !== "at_period_end") {
        await stripe.billingPortal.configurations.update(current.id, {
          features: {
            subscription_cancel: {
              enabled: true,
              mode: "at_period_end",
              proration_behavior: "none",
            },
          },
        });
      }
      configuration = current.id;
    }
  } catch {
    configuration = undefined;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId as string,
    return_url: input.returnUrl,
    ...(configuration ? { configuration } : {}),
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
