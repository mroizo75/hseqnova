import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createOrGetStripeCustomer } from "@/lib/stripe-billing";
import { getAdminDb } from "@/lib/supabase/admin";
import {
  daysUntilInvoiceDue,
  invoiceLineSummary,
  poundsToPence,
  type InvoiceLineInput,
} from "@/lib/invoice-lines";

export type SentStripeInvoice = {
  stripeInvoiceId: string;
  invoiceNumber: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  amount: number;
  amountExVat: number;
  vatAmount: number;
  vatRate: number;
  currency: string;
  dueDate: string;
  description: string;
  livemode: boolean;
  purchaseOrderNumber: string | null;
};

type BillingTenant = {
  id: string;
  name: string;
  invoiceEmail: string | null;
  contactEmail: string | null;
  purchaseOrderNumber: string | null;
  invoiceAddress: string | null;
  invoicePostalCode: string | null;
  invoiceCity: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
};

function stripeMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Stripe could not send the invoice";
}

function recipientEmail(tenant: BillingTenant): string {
  const email = (tenant.invoiceEmail || tenant.contactEmail || "").trim();
  if (!email) {
    throw {
      code: "INVOICE_EMAIL_MISSING",
      message: "Add an invoice email on the company before sending",
    };
  }
  return email;
}

function customerAddress(tenant: BillingTenant): Stripe.AddressParam | null {
  const line1 = (tenant.invoiceAddress || tenant.address || "").trim();
  const city = (tenant.invoiceCity || tenant.city || "").trim();
  const postalCode = (tenant.invoicePostalCode || tenant.postalCode || "").trim();
  if (!line1 && !postalCode) return null;
  return {
    line1: line1 || undefined,
    city: city || undefined,
    postal_code: postalCode || undefined,
    country: "GB",
  };
}

async function discardDraft(stripe: Stripe, invoiceId: string): Promise<void> {
  try {
    await stripe.invoices.del(invoiceId);
  } catch {
    try {
      await stripe.invoices.voidInvoice(invoiceId);
    } catch {
      // Draft is already gone.
    }
  }
}

export async function sendDetailedStripeInvoice(input: {
  tenantId: string;
  dueDate: string;
  note?: string;
  lines: InvoiceLineInput[];
}): Promise<SentStripeInvoice> {
  const { data: tenant, error } = await getAdminDb()
    .from("Tenant")
    .select(
      "id, name, invoiceEmail, contactEmail, purchaseOrderNumber, invoiceAddress, invoicePostalCode, invoiceCity, address, postalCode, city",
    )
    .eq("id", input.tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant) {
    throw { code: "TENANT_NOT_FOUND", message: "Company not found" };
  }

  const billingTenant = tenant as BillingTenant;
  const email = recipientEmail(billingTenant);
  const daysUntilDue = daysUntilInvoiceDue(input.dueDate);
  const description = invoiceLineSummary(input.lines);
  const purchaseOrder = billingTenant.purchaseOrderNumber?.trim() || null;
  const note = input.note?.trim() || "";
  const address = customerAddress(billingTenant);

  const stripe = getStripe();
  const customerId = await createOrGetStripeCustomer(input.tenantId);
  const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer | Stripe.DeletedCustomer;
  if (!("address" in customer)) {
    throw { code: "STRIPE_CUSTOMER_MISSING", message: "Stripe customer was deleted. Try again." };
  }
  if (!address && !customer.address?.country) {
    throw {
      code: "INVOICE_ADDRESS_MISSING",
      message: "Add an invoice address on the company. Stripe needs it to calculate VAT.",
    };
  }

  await stripe.customers.update(customerId, {
    email,
    name: billingTenant.name,
    ...(address ? { address } : {}),
  });

  let invoiceId: string | null = null;
  let sent = false;
  try {
    const draft = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      auto_advance: false,
      pending_invoice_items_behavior: "exclude",
      automatic_tax: { enabled: true },
      currency: "gbp",
      description: description.slice(0, 500),
      footer: note ? note.slice(0, 500) : undefined,
      metadata: { tenantId: input.tenantId, source: "admin_invoice" },
      ...(purchaseOrder
        ? { custom_fields: [{ name: "Purchase order", value: purchaseOrder.slice(0, 140) }] }
        : {}),
    });
    invoiceId = draft.id;

    for (const line of input.lines) {
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: draft.id,
        currency: "gbp",
        description: line.description,
        quantity: line.quantity,
        unit_amount_decimal: String(poundsToPence(line.unitAmount)),
        tax_behavior: "exclusive",
      });
    }

    const invoice = await stripe.invoices.sendInvoice(draft.id);
    sent = true;
    const total = invoice.total ?? 0;
    const subtotal = invoice.subtotal_excluding_tax ?? invoice.subtotal ?? 0;
    const vatPence = total - subtotal;
    return {
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number ?? null,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
      amount: total / 100,
      amountExVat: subtotal / 100,
      vatAmount: vatPence / 100,
      vatRate: subtotal > 0 ? Math.round((vatPence / subtotal) * 100) : 0,
      currency: (invoice.currency ?? "gbp").toUpperCase(),
      dueDate: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : new Date(`${input.dueDate}T00:00:00.000Z`).toISOString(),
      description,
      livemode: invoice.livemode,
      purchaseOrderNumber: purchaseOrder,
    };
  } catch (cause) {
    if (invoiceId && !sent) {
      await discardDraft(stripe, invoiceId);
    }
    if (cause && typeof cause === "object" && "code" in cause && "message" in cause) {
      throw cause;
    }
    throw { code: "STRIPE_INVOICE_FAILED", message: stripeMessage(cause) };
  }
}
