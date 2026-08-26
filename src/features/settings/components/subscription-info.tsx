"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Calendar, Users, ExternalLink, Receipt, CheckCircle2 } from "lucide-react";
import type { BillingMethod, Subscription, Tenant } from "@prisma/client";
import { openStripeBillingPortal, updateTenantBilling } from "@/server/actions/settings.actions";
import { addAddonToSubscription, removeAddonFromSubscription } from "@/server/actions/billing.actions";
import { useToast } from "@/hooks/use-toast";
import { SITE_CONFIG } from "@/lib/seo-config";
import {
  ADDON_PACKS,
  HSEQ_CORE,
  UK_VAT_PERCENT,
  isAddonPackActive,
  monthlyTotalGbp,
  type AddonPack,
} from "@/lib/billing-catalog";

interface SubscriptionInfoProps {
  tenant: Tenant & {
    subscription: Subscription | null;
  };
  isAdmin: boolean;
  enabledModuleKeys: string[];
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="border-green-200 bg-green-100 text-green-800">Active</Badge>;
    case "TRIAL":
      return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Trial</Badge>;
    case "PAST_DUE":
      return <Badge className="border-amber-200 bg-amber-100 text-amber-800">Past due</Badge>;
    case "CANCELLED":
      return <Badge className="border-red-200 bg-red-100 text-red-800">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function billingMethodLabel(method: BillingMethod | string | null | undefined): string {
  if (method === "DIRECT_DEBIT") return "Bacs Direct Debit";
  if (method === "CARD") return "Card";
  return "Invoice";
}

function formatMoneyGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionInfo({
  tenant,
  isAdmin,
  enabledModuleKeys,
}: SubscriptionInfoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [removingPackId, setRemovingPackId] = useState<string | null>(null);
  const subscription = tenant.subscription;
  const tenantStatus = tenant.status;
  const monthlyTotal = monthlyTotalGbp(enabledModuleKeys);

  const handleBillingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateTenantBilling({
      invoiceEmail: (formData.get("invoiceEmail") as string) || undefined,
      purchaseOrderNumber: (formData.get("purchaseOrderNumber") as string) || undefined,
      billingMethod: formData.get("billingMethod") as BillingMethod,
    });
    setSaving(false);
    if (result.success) {
      toast({ title: "Billing details saved", className: "bg-green-50 border-green-200" });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error,
      });
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    const result = await openStripeBillingPortal();
    setPortalLoading(false);
    if (result.success && result.url) {
      window.location.href = result.url;
      return;
    }
    toast({
      variant: "destructive",
      title: "Could not open Stripe",
      description: result.error || "No Stripe customer is linked yet. Contact support.",
    });
  };

  const handleRemovePack = async (pack: AddonPack) => {
    if (!isAdmin) return;
    setRemovingPackId(pack.id);
    const result = await removeAddonFromSubscription(pack.id);
    setRemovingPackId(null);
    if (result.success) {
      toast({
        title: `${pack.name} removed`,
        description: `Subscription is now ${formatMoneyGbp(result.price)} / month ex VAT.`,
      });
      router.refresh();
      return;
    }
    toast({
      variant: "destructive",
      title: "Could not remove",
      description: result.error,
    });
  };

  const handleBuyPack = async (pack: AddonPack) => {
    if (!isAdmin) return;
    setBuyingPackId(pack.id);
    const result = await addAddonToSubscription(pack.id);
    setBuyingPackId(null);
    if (result.success) {
      toast({
        title: `${pack.name} added`,
        description: `Subscription is now ${formatMoneyGbp(result.price)} / month ex VAT.`,
      });
      router.refresh();
      return;
    }
    toast({
      variant: "destructive",
      title: "Could not update the subscription",
      description: result.error,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            {HSEQ_CORE.name} is billed per company, unlimited users, in GBP excluding VAT ({UK_VAT_PERCENT}%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold">{HSEQ_CORE.name}</p>
                <p className="text-xs text-muted-foreground">{HSEQ_CORE.legalHook}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {subscription ? statusBadge(subscription.status) : statusBadge(tenantStatus === "TRIAL" ? "TRIAL" : "ACTIVE")}
                  {tenantStatus === "TRIAL" && subscription ? statusBadge("TRIAL") : null}
                  {subscription?.cancelAtPeriodEnd ? (
                    <Badge variant="outline">Ends at period close</Badge>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">
                  {formatMoneyGbp(HSEQ_CORE.monthlyPriceGbp)}
                  <span className="text-sm font-normal text-muted-foreground"> / month</span>
                </p>
                <p className="text-xs text-muted-foreground">ex VAT</p>
              </div>
            </div>

            <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
              <div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Current period
                </p>
                <p className="font-medium">
                  {subscription
                    ? `${formatDate(subscription.currentPeriodStart)} – ${formatDate(subscription.currentPeriodEnd)}`
                    : tenant.trialEndsAt
                      ? `Trial to ${formatDate(tenant.trialEndsAt)}`
                      : "No billing period yet"}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Users
                </p>
                <p className="font-medium">Unlimited</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment</p>
                <p className="font-medium">{billingMethodLabel(tenant.billingMethod)}</p>
              </div>
            </div>

            {(tenantStatus === "TRIAL" || tenant.trialEndsAt) && tenant.trialEndsAt ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Trial ends {formatDate(tenant.trialEndsAt)}. Card or Direct Debit is taken through Stripe.
              </div>
            ) : null}

            {isAdmin && tenant.stripeCustomerId ? (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button type="button" onClick={handleOpenPortal} disabled={portalLoading}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {portalLoading ? "Opening…" : "Manage billing in Stripe"}
                </Button>
                <p className="self-center text-xs text-muted-foreground">
                  Update payment method, download invoices, or cancel at period end.
                </p>
              </div>
            ) : isAdmin ? (
              <p className="border-t pt-4 text-sm text-muted-foreground">
                Stripe is not linked yet. Add an add-on below or email {SITE_CONFIG.contactEmail}.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add-ons</CardTitle>
          <CardDescription>
            What this company has on top of {HSEQ_CORE.name}. Adding a pack updates the same subscription and monthly total.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {ADDON_PACKS.map((pack) => {
              const included = isAddonPackActive(enabledModuleKeys, pack);
              return (
                <div
                  key={pack.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{pack.name}</p>
                      {included ? (
                        <Badge className="border-green-200 bg-green-100 text-green-800">Included</Badge>
                      ) : (
                        <Badge variant="outline">Not added</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{pack.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{pack.legalHook}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-sm font-semibold">
                      {formatMoneyGbp(pack.monthlyPriceGbp)}
                      <span className="font-normal text-muted-foreground">/month</span>
                    </p>
                    {included ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                        {isAdmin && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleRemovePack(pack)}
                            disabled={removingPackId === pack.id}
                          >
                            {removingPackId === pack.id ? "Removing…" : "Remove"}
                          </Button>
                        )}
                      </div>
                    ) : isAdmin ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleBuyPack(pack)}
                        disabled={buyingPackId === pack.id}
                      >
                        {buyingPackId === pack.id ? "Adding…" : "Add to subscription"}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Ask an administrator</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t pt-4 text-sm">
            <p className="text-muted-foreground">Subscription total ex VAT</p>
            <p className="font-semibold">{formatMoneyGbp(monthlyTotal)} / month</p>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <form onSubmit={handleBillingSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice details
              </CardTitle>
              <CardDescription>
                Used on VAT invoices. Purchase order number is printed when your accounts payable needs it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceEmail">Accounts email</Label>
                  <Input
                    id="invoiceEmail"
                    name="invoiceEmail"
                    type="email"
                    placeholder="accounts@company.co.uk"
                    defaultValue={tenant.invoiceEmail || tenant.contactEmail || ""}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderNumber">Purchase order number</Label>
                  <Input
                    id="purchaseOrderNumber"
                    name="purchaseOrderNumber"
                    placeholder="PO-12345"
                    defaultValue={tenant.purchaseOrderNumber || ""}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingMethod">Preferred payment</Label>
                <Select name="billingMethod" defaultValue={tenant.billingMethod || "INVOICE"} disabled={saving}>
                  <SelectTrigger id="billingMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVOICE">Invoice (30 days)</SelectItem>
                    <SelectItem value="DIRECT_DEBIT">Bacs Direct Debit</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save invoice details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
