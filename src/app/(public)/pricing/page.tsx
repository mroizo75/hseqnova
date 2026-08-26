import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PAGE_METADATA, getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";
import { ADDON_PACKS, HSEQ_CORE, UK_VAT_PERCENT } from "@/lib/billing-catalog";

export const metadata: Metadata = {
  title: PAGE_METADATA.priser.title,
  description: PAGE_METADATA.priser.description,
  alternates: { canonical: getCanonicalUrl("/pricing") },
  robots: ROBOTS_CONFIG,
};

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-4 text-4xl font-bold">Pricing</h1>
      <p className="mb-8 text-muted-foreground">
        One price per company, unlimited users. Core HSEQ is always included. Add-ons are optional.
        Self-serve checkout is card or Bacs Direct Debit. Invoice (Net 30) is available if you ask us.
        Every subscription includes a UK VAT invoice at {UK_VAT_PERCENT}%.
      </p>
      <div className="mb-8 rounded-xl border p-8">
        <h2 className="mb-2 text-xl font-semibold">{HSEQ_CORE.name}</h2>
        <p className="mb-1 text-3xl font-bold">
          {formatGbp(HSEQ_CORE.monthlyPriceGbp)}
          <span className="text-base font-normal text-muted-foreground">/month ex VAT</span>
        </p>
        <p className="mb-4 text-sm text-muted-foreground">{HSEQ_CORE.description}</p>
        <ul className="mb-6 list-disc space-y-1 pl-5 text-sm">
          <li>Living health and safety policy</li>
          <li>Digital accident book and RIDDOR triage</li>
          <li>Risk assessments, procedures, inspections</li>
          <li>Training, fire drills, annual H&amp;S plan</li>
        </ul>
        <Button asChild>
          <Link href="/register">Start now</Link>
        </Button>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Add-ons</h2>
      <ul className="mb-8 space-y-3">
        {ADDON_PACKS.map((pack) => (
          <li key={pack.id} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium">{pack.name}</p>
              <p className="text-sm">{formatGbp(pack.monthlyPriceGbp)}/mo</p>
            </div>
            <p className="text-sm text-muted-foreground">{pack.description}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Need invoice billing? Email hello@hseqnova.co.uk.
      </p>
    </div>
  );
}
