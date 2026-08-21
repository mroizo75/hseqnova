import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "invoice.paid" || event.type === "invoice.finalized") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (customerId) {
      const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
      if (tenant) {
        await prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          create: {
            tenantId: tenant.id,
            stripeInvoiceId: invoice.id,
            invoiceNumber: invoice.number ?? undefined,
            amount: (invoice.total ?? 0) / 100,
            amountExVat: (invoice.subtotal ?? 0) / 100,
            vatAmount: ((invoice.total ?? 0) - (invoice.subtotal ?? 0)) / 100,
            vatRate: 20,
            currency: (invoice.currency ?? "gbp").toUpperCase(),
            dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
            paidDate: event.type === "invoice.paid" ? new Date() : undefined,
            status: event.type === "invoice.paid" ? "PAID" : "SENT",
            description: invoice.description ?? undefined,
          },
          update: {
            status: event.type === "invoice.paid" ? "PAID" : "SENT",
            paidDate: event.type === "invoice.paid" ? new Date() : undefined,
            invoiceNumber: invoice.number ?? undefined,
          },
        });
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    await prisma.tenant.updateMany({
      where: { stripeCustomerId: customerId },
      data: { stripeSubscriptionId: subscription.id },
    });
  }

  return NextResponse.json({ received: true });
}
