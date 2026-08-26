"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ADDON_PACKS,
  HSEQ_CORE,
  UK_VAT_PERCENT,
} from "@/lib/billing-catalog";
import {
  resumeSelfServeCheckout,
  startSelfServeCheckout,
} from "@/server/actions/signup-checkout.actions";
import type { AddonPackId } from "@/lib/billing-catalog";
import type { SignupBillingMethod } from "@/lib/signup-checkout";

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

type RegisterFormProps = {
  mode: "signup" | "pay";
  cancelled?: boolean;
  prefillEmail?: string;
};

export function RegisterForm({ mode, cancelled = false, prefillEmail = "" }: RegisterFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [billingMethod, setBillingMethod] = useState<SignupBillingMethod>("CARD");
  const [addonIds, setAddonIds] = useState<AddonPackId[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const monthlyExVat = useMemo(() => {
    return (
      HSEQ_CORE.monthlyPriceGbp +
      ADDON_PACKS.filter((pack) => addonIds.includes(pack.id)).reduce(
        (sum, pack) => sum + pack.monthlyPriceGbp,
        0,
      )
    );
  }, [addonIds]);

  const toggleAddon = (id: AddonPackId, checked: boolean) => {
    setAddonIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("You must accept the terms to continue.");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "pay"
          ? await resumeSelfServeCheckout({ addonIds, billingMethod })
          : await startSelfServeCheckout({
              companyName,
              companyNumber,
              contactName,
              email,
              password,
              phone,
              billingMethod,
              addonIds,
              acceptedTerms: true,
            });

      if (!result.success) {
        setError("error" in result ? result.error : "Could not start checkout");
        return;
      }
      if (!("url" in result)) return;
      window.location.assign(result.url);
    } catch {
      setError("Something went wrong. Try again, or contact hello@hseqnova.co.uk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "pay" ? "Finish payment" : "Create your HSEQ Nova account"}
        </CardTitle>
        <CardDescription>
          {mode === "pay"
            ? "Choose how to pay and any add-ons, then continue to Stripe Checkout."
            : "Core is included. Add-ons are optional. You pay on Stripe before the dashboard opens."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cancelled && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Checkout was cancelled. You can start payment again below.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "signup" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    required
                    disabled={loading}
                    placeholder="Alder & Pike Construction Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyNumber">Companies House number</Label>
                  <Input
                    id="companyNumber"
                    value={companyNumber}
                    onChange={(event) => setCompanyNumber(event.target.value)}
                    required
                    disabled={loading}
                    placeholder="12345678"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    disabled={loading}
                    placeholder="020 7946 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Your name</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    disabled={loading}
                    placeholder="you@company.co.uk"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">At least 8 characters. Use this to sign in after payment.</p>
                </div>
              </div>
            </>
          )}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Payment method</legend>
            <label className="flex items-start gap-3 rounded-md border p-3">
              <input
                type="radio"
                name="billingMethod"
                className="mt-1"
                checked={billingMethod === "CARD"}
                onChange={() => setBillingMethod("CARD")}
                disabled={loading}
              />
              <span>
                <span className="block font-medium">Card</span>
                <span className="text-sm text-muted-foreground">Visa, Mastercard or other cards accepted by Stripe.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border p-3">
              <input
                type="radio"
                name="billingMethod"
                className="mt-1"
                checked={billingMethod === "DIRECT_DEBIT"}
                onChange={() => setBillingMethod("DIRECT_DEBIT")}
                disabled={loading}
              />
              <span>
                <span className="block font-medium">Bacs Direct Debit</span>
                <span className="text-sm text-muted-foreground">UK bank account. The first collection can take a few days.</span>
              </span>
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Add-ons (optional)</legend>
            {ADDON_PACKS.map((pack) => {
              const checked = addonIds.includes(pack.id);
              return (
                <label key={pack.id} className="flex items-start gap-3 rounded-md border p-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggleAddon(pack.id, value === true)}
                    disabled={loading}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{pack.name}</span>
                      <span className="shrink-0 text-sm">{formatGbp(pack.monthlyPriceGbp)}/mo</span>
                    </span>
                    <span className="block text-sm text-muted-foreground">{pack.description}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div className="rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">
              {formatGbp(monthlyExVat)} / month ex VAT
            </p>
            <p className="text-muted-foreground">
              Plus {UK_VAT_PERCENT}% VAT. Invoice Net 30 is available from hello@hseqnova.co.uk — not in this checkout.
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={acceptedTerms}
              onCheckedChange={(value) => setAcceptedTerms(value === true)}
              disabled={loading}
              className="mt-0.5"
            />
            <span>
              I accept the{" "}
              <Link href="/vilkar" className="underline">
                terms
              </Link>{" "}
              and understand this is a monthly subscription.
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Opening Stripe…" : "Continue to Stripe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
