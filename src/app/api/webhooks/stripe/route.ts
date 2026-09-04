import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import {
  activateAddonPackForTenant,
  activatePaidSignup,
  applyStripeSubscriptionAccess,
  loadEnabledBillingModuleKeys,
  syncLiveStripeSubscription,
  upsertSubscriptionTotal,
} from "@/server/queries/billing.queries";
import { isVoluntaryCancel, shouldKeepAccessAfterCancel } from "@/lib/stripe-subscription-access";
import { parseSignupCheckoutMetadata } from "@/lib/signup-checkout";
import Stripe from "stripe";

export const runtime = "nodejs";
export const maxDuration = 30;

function stripeRefId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return error instanceof Error ? error.message : "Webhook processing failed";
}

async function handleSignupFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  refs: { customerId?: string | null; subscriptionId?: string | null },
): Promise<boolean> {
  const signup = parseSignupCheckoutMetadata(metadata ?? undefined);
  if (!signup) {
    return false;
  }
  await activatePaidSignup({
    tenantId: signup.tenantId,
    addonIds: signup.addonIds,
    stripeCustomerId: refs.customerId,
    stripeSubscriptionId: refs.subscriptionId,
  });
  return true;
}

async function processEvent(event: Stripe.Event): Promise<void> {
  const db = getAdminDb();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const handledSignup = await handleSignupFromMetadata(session.metadata, {
      customerId: stripeRefId(session.customer),
      subscriptionId: stripeRefId(session.subscription as string | { id: string } | null),
    });

    if (!handledSignup) {
      const tenantId = session.metadata?.tenantId;
      const packId = session.metadata?.packId;
      if (tenantId && packId) {
        const priceId =
          typeof session.line_items?.data[0]?.price === "object"
            ? session.line_items.data[0].price?.id ?? null
            : null;
        await activateAddonPackForTenant({
          tenantId,
          packId,
          stripePriceId: priceId,
        });
        const enabled = await loadEnabledBillingModuleKeys(tenantId);
        await upsertSubscriptionTotal(tenantId, enabled);
      }
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.finalized") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = stripeRefId(invoice.customer);
    if (customerId) {
      const { data: tenant } = await db
        .from("Tenant")
        .select("id")
        .eq("stripeCustomerId", customerId)
        .maybeSingle();
      if (tenant?.id) {
        const { data: existing } = await db
          .from("Invoice")
          .select("id")
          .eq("stripeInvoiceId", invoice.id)
          .maybeSingle();
        const now = new Date().toISOString();
        const payload = {
          tenantId: tenant.id,
          stripeInvoiceId: invoice.id,
          invoiceNumber: invoice.number ?? null,
          amount: (invoice.total ?? 0) / 100,
          amountExVat: (invoice.subtotal ?? 0) / 100,
          vatAmount: ((invoice.total ?? 0) - (invoice.subtotal ?? 0)) / 100,
          vatRate:
            (invoice.subtotal ?? 0) > 0
              ? Math.round((((invoice.total ?? 0) - (invoice.subtotal ?? 0)) / (invoice.subtotal ?? 1)) * 100)
              : 0,
          currency: (invoice.currency ?? "gbp").toUpperCase(),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : now,
          paidDate: event.type === "invoice.paid" ? now : null,
          status: event.type === "invoice.paid" ? "PAID" : "SENT",
          description: invoice.description ?? null,
          updatedAt: now,
        };
        if (existing?.id) {
          await db.from("Invoice").update(payload).eq("id", existing.id);
        } else {
          await db.from("Invoice").insert({
            id: createId(),
            ...payload,
            createdAt: now,
          });
        }
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = stripeRefId(subscription.customer);
    const isLive =
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      subscription.status === "past_due";
    if (customerId && isLive) {
      await db
        .from("Tenant")
        .update({ stripeSubscriptionId: subscription.id, updatedAt: new Date().toISOString() })
        .eq("stripeCustomerId", customerId);
      if (shouldKeepAccessAfterCancel(subscription)) {
        await applyStripeSubscriptionAccess({ stripeCustomerId: customerId, subscription });
      } else {
        await syncLiveStripeSubscription({
          stripeCustomerId: customerId,
          subscriptionId: subscription.id,
          subscription,
        });
      }
    } else if (customerId) {
      await applyStripeSubscriptionAccess({ stripeCustomerId: customerId, subscription });
    }

    if (subscription.status === "active") {
      await handleSignupFromMetadata(subscription.metadata, {
        customerId,
        subscriptionId: subscription.id,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = stripeRefId(subscription.customer);
    if (customerId) {
      await applyStripeSubscriptionAccess({ stripeCustomerId: customerId, subscription });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = stripeRefId(invoice.customer);
    if (customerId) {
      const { data: tenant } = await db
        .from("Tenant")
        .select("id, status")
        .eq("stripeCustomerId", customerId)
        .maybeSingle();
      if (tenant && tenant.status !== "SUSPENDED" && tenant.status !== "CANCELLED") {
        const { data: localSub } = await db
          .from("Subscription")
          .select("cancelAtPeriodEnd")
          .eq("tenantId", tenant.id)
          .maybeSingle();
        const cancelledLocally = Boolean(localSub?.cancelAtPeriodEnd);
        const subscription = (invoice as Stripe.Invoice & { subscription?: Stripe.Subscription | string | null })
          .subscription;
        const cancelledOnInvoice =
          typeof subscription === "object" && subscription
            ? isVoluntaryCancel(subscription)
            : false;
        if (!cancelledLocally && !cancelledOnInvoice) {
          const now = new Date().toISOString();
          await db
            .from("Tenant")
            .update({ status: "SUSPENDED", suspendedAt: now, updatedAt: now })
            .eq("id", tenant.id)
            .neq("onboardingStatus", "NOT_STARTED");
        }
      }
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = stripeRefId(invoice.customer);
    if (customerId) {
      const now = new Date().toISOString();
      await db
        .from("Tenant")
        .update({ status: "ACTIVE", suspendedAt: null, updatedAt: now })
        .eq("stripeCustomerId", customerId)
        .eq("status", "SUSPENDED");
    }
  }
}

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

  try {
    await processEvent(event);
  } catch (error) {
    return NextResponse.json({ received: true, error: errorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
