"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ADDON_PACKS,
  ANNUAL_DISCOUNT_PERCENT,
  HSEQ_CORE,
  VAT_REVERSE_CHARGE_NOTE,
  yearlyPriceGbp,
  type AddonPackId,
} from "@/lib/billing-catalog";
import { startDemoConversionCheckout } from "@/server/actions/signup-checkout.actions";
import type { SignupBillingMethod } from "@/lib/signup-checkout";

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

type SubscribeFormProps = {
  companyName: string;
  trialEndsAt: string | null;
  expired: boolean;
  defaultAddonIds: AddonPackId[];
  cancelled?: boolean;
};

export function SubscribeForm({
  companyName,
  trialEndsAt,
  expired,
  defaultAddonIds,
  cancelled = false,
}: SubscribeFormProps) {
  const [addonIds, setAddonIds] = useState<AddonPackId[]>(defaultAddonIds);
  const [billingMethod, setBillingMethod] = useState<SignupBillingMethod>("CARD");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const monthlyExVat =
    HSEQ_CORE.monthlyPriceGbp +
    ADDON_PACKS.filter((pack) => addonIds.includes(pack.id)).reduce((sum, pack) => sum + pack.monthlyPriceGbp, 0);
  const yearlyExVat = yearlyPriceGbp(monthlyExVat);
  const billedExVat = billingInterval === "year" ? yearlyExVat : monthlyExVat;

  const endsLabel = useMemo(() => {
    if (!trialEndsAt) return null;
    return new Date(trialEndsAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [trialEndsAt]);

  function toggleAddon(id: AddonPackId, checked: boolean) {
    setAddonIds((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await startDemoConversionCheckout({
      addonIds,
      billingMethod,
      billingInterval,
    });
    if ("url" in result) {
      window.location.href = result.url;
      return;
    }
    setLoading(false);
    setError("error" in result ? result.error : "Could not start checkout");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscribe — {companyName}</CardTitle>
          <CardDescription>
            {expired
              ? "The demo has ended. Choose Core plus add-ons and pay to restore access."
              : endsLabel
                ? `Demo access runs until ${endsLabel}. Subscribe now to keep the workspace without interruption.`
                : "Choose Core plus add-ons and pay in Stripe."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cancelled ? (
            <p className="text-sm text-amber-800">Checkout was cancelled. You can try again.</p>
          ) : null}
          <div className="rounded-lg border p-3">
            <p className="font-medium">{HSEQ_CORE.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month · always included
            </p>
          </div>
          {ADDON_PACKS.map((pack) => (
            <label key={pack.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={addonIds.includes(pack.id)}
                onCheckedChange={(checked) => toggleAddon(pack.id, checked === true)}
              />
              <span>
                <span className="font-medium">{pack.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {pack.description} · {formatGbp(pack.monthlyPriceGbp)}/month
                </span>
              </span>
            </label>
          ))}
          <div className="space-y-2">
            <Label>Billing</Label>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="interval"
                  checked={billingInterval === "month"}
                  onChange={() => setBillingInterval("month")}
                />
                Monthly
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="interval"
                  checked={billingInterval === "year"}
                  onChange={() => setBillingInterval("year")}
                />
                Yearly ({ANNUAL_DISCOUNT_PERCENT}% off)
              </label>
            </div>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="method"
                  checked={billingMethod === "CARD"}
                  onChange={() => setBillingMethod("CARD")}
                />
                Card
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="method"
                  checked={billingMethod === "DIRECT_DEBIT"}
                  onChange={() => setBillingMethod("DIRECT_DEBIT")}
                />
                Bacs Direct Debit
              </label>
            </div>
          </div>
          <p className="text-lg font-semibold">
            {formatGbp(billedExVat)}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {billingInterval === "year" ? "year" : "month"} ex VAT
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{VAT_REVERSE_CHARGE_NOTE}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Opening Stripe…" : "Continue to payment"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
