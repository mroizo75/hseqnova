import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createOrGetStripeCustomer } from "@/lib/stripe-billing";
import { getAdminDb } from "@/lib/supabase/admin";
import {
  daysUntilInvoiceDue,
  invoiceLineSummary,
  poundsToPence,
  requireInvoiceCustomer,
  type InvoiceCustomerInput,
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

function stripeMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Stripe could not send the invoice";
}

async function customerIdForTenant(tenantId: string): Promise<string> {
  try {
    return await createOrGetStripeCustomer(tenantId);
  } catch (cause) {
    if (!/no such customer/i.test(stripeMessage(cause))) {
      throw cause;
    }
    const { error } = await getAdminDb()
      .from("Tenant")
      .update({ stripeCustomerId: null, updatedAt: new Date().toISOString() })
      .eq("id", tenantId);
    if (error) {
      throw { code: "TENANT_UPDATE_FAILED", message: error.message };
    }
    return createOrGetStripeCustomer(tenantId);
  }
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
  customer: InvoiceCustomerInput;
}): Promise<SentStripeInvoice> {
  const customer = requireInvoiceCustomer(input.customer);
  const { data: tenant, error } = await getAdminDb()
    .from("Tenant")
    .select("id, name")
    .eq("id", input.tenantId)
    .maybeSingle();
  if (error) {
    throw { code: "TENANT_LOOKUP_FAILED", message: error.message };
  }
  if (!tenant) {
    throw { code: "TENANT_NOT_FOUND", message: "Company not found" };
  }

  const now = new Date().toISOString();
  const { error: saveError } = await getAdminDb()
    .from("Tenant")
    .update({
      invoiceEmail: customer.email,
      invoiceAddress: customer.addressLine1,
      invoiceCity: customer.city,
      invoicePostalCode: customer.postcode,
      vatNumber: customer.vatNumber,
      purchaseOrderNumber: customer.purchaseOrderNumber,
      updatedAt: now,
    })
    .eq("id", input.tenantId);
  if (saveError) {
    throw { code: "TENANT_UPDATE_FAILED", message: saveError.message };
  }

  const daysUntilDue = daysUntilInvoiceDue(input.dueDate);
  const description = invoiceLineSummary(input.lines);
  const note = input.note?.trim() || "";
  const stripe = getStripe();
  const customerId = await customerIdForTenant(input.tenantId);
  await stripe.customers.update(customerId, {
    email: customer.email,
    name: tenant.name as string,
    address: {
      line1: customer.addressLine1,
      city: customer.city,
      postal_code: customer.postcode,
      country: "GB",
    },
  });
  if (customer.vatNumber) {
    const value = customer.vatNumber.startsWith("GB") ? customer.vatNumber : `GB${customer.vatNumber}`;
    try {
      await stripe.customers.createTaxId(customerId, { type: "gb_vat", value });
    } catch (cause) {
      const message = stripeMessage(cause);
      if (!/already/i.test(message)) {
        throw { code: "VAT_NUMBER_REJECTED", message: "Stripe rejected the VAT number. Use a GB VAT number, for example GB123456789." };
      }
    }
  }

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
      ...(customer.purchaseOrderNumber
        ? { custom_fields: [{ name: "Purchase order", value: customer.purchaseOrderNumber.slice(0, 140) }] }
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
      purchaseOrderNumber: customer.purchaseOrderNumber,
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
