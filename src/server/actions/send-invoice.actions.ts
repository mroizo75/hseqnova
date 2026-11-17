"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { createId } from "@/lib/ids";
import { getAdminDb } from "@/lib/supabase/admin";
import { sendDetailedStripeInvoice } from "@/lib/send-stripe-invoice";

const lineSchema = z.object({
  description: z.string().trim().min(1, "Each line needs a description").max(500),
  quantity: z.number().int().min(1).max(999),
  unitAmount: z.number().positive().max(1_000_000),
});

const customerSchema = z.object({
  email: z.string().trim().min(1, "Enter an invoice email"),
  addressLine1: z.string().trim().min(1, "Enter the first line of the invoice address").max(200),
  city: z.string().trim().min(1, "Enter the invoice city").max(100),
  postcode: z.string().trim().min(2, "Enter the invoice postcode").max(12),
  vatNumber: z.string().trim().max(20).optional(),
  purchaseOrderNumber: z.string().trim().max(140).optional(),
});

const sendInvoiceSchema = z.object({
  tenantId: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date"),
  note: z.string().trim().max(500).optional(),
  lines: z.array(lineSchema).min(1, "Add at least one line").max(20),
  customer: customerSchema,
});

export type SendInvoiceResult =
  | {
      success: true;
      saved: boolean;
      invoiceNumber: string | null;
      hostedInvoiceUrl: string | null;
      livemode: boolean;
      warning?: string;
    }
  | { success: false; error: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  return fallback;
}

export async function sendTenantInvoice(input: z.infer<typeof sendInvoiceSchema>): Promise<SendInvoiceResult> {
  try {
    const staff = await requirePlatformStaff();
    if (!staff?.isSuperAdmin) {
      return { success: false, error: "Only a superadmin can send invoices" };
    }

    const validated = sendInvoiceSchema.parse(input);
    const sent = await sendDetailedStripeInvoice({
      tenantId: validated.tenantId,
      dueDate: validated.dueDate,
      note: validated.note,
      lines: validated.lines,
      customer: {
        email: validated.customer.email,
        addressLine1: validated.customer.addressLine1,
        city: validated.customer.city,
        postcode: validated.customer.postcode,
        vatNumber: validated.customer.vatNumber || null,
        purchaseOrderNumber: validated.customer.purchaseOrderNumber || null,
      },
    });

    const now = new Date().toISOString();
    const payload = {
      tenantId: validated.tenantId,
      stripeInvoiceId: sent.stripeInvoiceId,
      invoiceNumber: sent.invoiceNumber,
      amount: sent.amount,
      amountExVat: sent.amountExVat,
      vatAmount: sent.vatAmount,
      vatRate: sent.vatRate,
      currency: sent.currency,
      purchaseOrderNumber: sent.purchaseOrderNumber,
      dueDate: sent.dueDate,
      paidDate: null,
      status: "SENT",
      description: sent.description,
      updatedAt: now,
    };

    const db = getAdminDb();
    const { error: insertError } = await db.from("Invoice").insert({
      id: createId(),
      ...payload,
      createdAt: now,
    });

    let saved = !insertError;
    if (insertError?.code === "23505") {
      const { error: updateError } = await db.from("Invoice").update(payload).eq("stripeInvoiceId", sent.stripeInvoiceId);
      saved = !updateError;
    }

    revalidatePath(`/admin/tenants/${validated.tenantId}`);
    revalidatePath("/admin/invoices");

    return {
      success: true,
      saved,
      invoiceNumber: sent.invoiceNumber,
      hostedInvoiceUrl: sent.hostedInvoiceUrl,
      livemode: sent.livemode,
      ...(saved
        ? {}
        : {
            warning:
              "Stripe sent the invoice, but it is not stored in HSEQ Nova yet. It will appear when Stripe confirms it. Do not send it again.",
          }),
    };
  } catch (error) {
    return { success: false, error: errorMessage(error, "Could not send the invoice") };
  }
}
