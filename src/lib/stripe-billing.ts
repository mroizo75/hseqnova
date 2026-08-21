import { getStripe, UK_VAT_PERCENT, DEFAULT_CURRENCY } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function createOrGetStripeCustomer(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      invoiceEmail: true,
      vatNumber: true,
      purchaseOrderNumber: true,
      stripeCustomerId: true,
    },
  });
  if (!tenant) {
    throw { code: "TENANT_NOT_FOUND", message: "Company not found" };
  }
  if (tenant.stripeCustomerId) {
    return tenant.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenant.name,
    email: tenant.invoiceEmail || tenant.contactEmail || undefined,
    metadata: { tenantId: tenant.id },
    tax_exempt: "none",
  });

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function createCheckoutSession(input: {
  tenantId: string;
  priceIds: string[];
  billingMethod: "INVOICE" | "DIRECT_DEBIT" | "CARD";
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const customerId = await createOrGetStripeCustomer(input.tenantId);
  const stripe = getStripe();

  const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
    input.billingMethod === "DIRECT_DEBIT"
      ? ["bacs_debit"]
      : input.billingMethod === "INVOICE"
        ? ["bacs_debit"]
        : ["card"];

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: paymentMethodTypes,
    line_items: input.priceIds.map((price) => ({ price, quantity: 1 })),
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    automatic_tax: { enabled: false },
    invoice_creation: { enabled: true },
    metadata: { tenantId: input.tenantId, vatPercent: String(UK_VAT_PERCENT) },
    currency: DEFAULT_CURRENCY,
  });

  if (!session.url) {
    throw { code: "STRIPE_CHECKOUT_FAILED", message: "Could not create Stripe Checkout session" };
  }
  return { url: session.url };
}
