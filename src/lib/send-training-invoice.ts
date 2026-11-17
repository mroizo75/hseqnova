import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  daysUntilInvoiceDue,
  invoiceLineSummary,
  poundsToPence,
  requireInvoiceCustomer,
  type InvoiceCustomerInput,
  type InvoiceLineInput,
} from "@/lib/invoice-lines";

export type SentTrainingInvoice = {
  stripeCustomerId: string;
  stripeInvoiceId: string;
  invoiceNumber: string | null;
  hostedInvoiceUrl: string | null;
  amount: number;
  amountExVat: number;
  currency: string;
  dueDate: string;
};

function stripeMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Stripe could not send the invoice";
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

export async function ensureTrainingStripeCustomer(input: {
  existingCustomerId: string | null;
  companyName: string;
  engagementId: string;
  organisationId: string;
  customer: InvoiceCustomerInput;
}): Promise<string> {
  const stripe = getStripe();
  const address = {
    line1: input.customer.addressLine1,
    city: input.customer.city,
    postal_code: input.customer.postcode,
    country: "GB",
  };
  if (input.existingCustomerId) {
    try {
      await stripe.customers.update(input.existingCustomerId, {
        email: input.customer.email,
        name: input.companyName,
        address,
        metadata: {
          source: "training",
          engagementId: input.engagementId,
          organisationId: input.organisationId,
        },
      });
      return input.existingCustomerId;
    } catch (cause) {
      if (!/no such customer/i.test(stripeMessage(cause))) {
        throw { code: "STRIPE_CUSTOMER_FAILED", message: stripeMessage(cause) };
      }
    }
  }

  try {
    const created = await stripe.customers.create({
      email: input.customer.email,
      name: input.companyName,
      address,
      metadata: {
        source: "training",
        engagementId: input.engagementId,
        organisationId: input.organisationId,
      },
    });
    return created.id;
  } catch (cause) {
    throw { code: "STRIPE_CUSTOMER_FAILED", message: stripeMessage(cause) };
  }
}

export async function sendTrainingStripeInvoice(input: {
  stripeCustomerId: string;
  engagementId: string;
  organisationId: string;
  courseKey: string;
  dueDate: string;
  note?: string;
  lines: InvoiceLineInput[];
  customer: InvoiceCustomerInput;
}): Promise<SentTrainingInvoice> {
  const customer = requireInvoiceCustomer(input.customer);
  const stripe = getStripe();
  if (customer.vatNumber) {
    const value = customer.vatNumber.startsWith("GB") ? customer.vatNumber : `GB${customer.vatNumber}`;
    try {
      await stripe.customers.createTaxId(input.stripeCustomerId, { type: "gb_vat", value });
    } catch (cause) {
      const message = stripeMessage(cause);
      if (!/already/i.test(message)) {
        throw {
          code: "VAT_NUMBER_REJECTED",
          message: "Stripe rejected the VAT number. Use a GB VAT number, for example GB123456789.",
        };
      }
    }
  }

  const daysUntilDue = daysUntilInvoiceDue(input.dueDate);
  const description = invoiceLineSummary(input.lines);
  let invoiceId: string | null = null;
  let sent = false;
  try {
    const draft = await stripe.invoices.create({
      customer: input.stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      auto_advance: false,
      pending_invoice_items_behavior: "exclude",
      automatic_tax: { enabled: true },
      currency: "gbp",
      description: description.slice(0, 500),
      footer: input.note?.trim() ? input.note.trim().slice(0, 500) : undefined,
      metadata: {
        source: "training",
        engagementId: input.engagementId,
        organisationId: input.organisationId,
        courseKey: input.courseKey,
      },
      ...(customer.purchaseOrderNumber
        ? { custom_fields: [{ name: "Purchase order", value: customer.purchaseOrderNumber.slice(0, 140) }] }
        : {}),
    });
    invoiceId = draft.id;

    for (const line of input.lines) {
      await stripe.invoiceItems.create({
        customer: input.stripeCustomerId,
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
    return {
      stripeCustomerId: input.stripeCustomerId,
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number ?? null,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      amount: total / 100,
      amountExVat: subtotal / 100,
      currency: (invoice.currency ?? "gbp").toUpperCase(),
      dueDate: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : new Date(`${input.dueDate}T00:00:00.000Z`).toISOString(),
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

export async function voidTrainingStripeInvoice(stripeInvoiceId: string): Promise<void> {
  const stripe = getStripe();
  try {
    await stripe.invoices.voidInvoice(stripeInvoiceId);
  } catch (cause) {
    const message = stripeMessage(cause);
    if (/already|void|paid/i.test(message)) {
      return;
    }
    throw { code: "STRIPE_VOID_FAILED", message };
  }
}
