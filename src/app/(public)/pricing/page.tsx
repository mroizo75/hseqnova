import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PAGE_METADATA, getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: PAGE_METADATA.priser.title,
  description: PAGE_METADATA.priser.description,
  alternates: { canonical: getCanonicalUrl("/pricing") },
  robots: ROBOTS_CONFIG,
};

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-muted-foreground mb-8">
        One price per company, unlimited users. Core HSEQ is always included. Industry packs and extras are add-ons.
        Every subscription issues a UK VAT invoice. Pay by Bacs Direct Debit, card, or invoice (Net 30, PO number).
      </p>
      <div className="rounded-xl border p-8 mb-8">
        <h2 className="text-xl font-semibold mb-2">Core HSEQ</h2>
        <p className="text-sm text-muted-foreground mb-4">HSWA, MHSWR and RIDDOR for every company.</p>
        <ul className="list-disc pl-5 space-y-1 text-sm mb-6">
          <li>Living health and safety policy</li>
          <li>Digital accident book and RIDDOR triage</li>
          <li>Risk assessments, procedures, inspections</li>
          <li>Training, fire drills, annual H&amp;S plan</li>
        </ul>
        <Button asChild>
          <Link href="/register">Start a trial</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Add-ons: construction / CDM, COSHH, RAMS, electrical, food / HACCP, hospitality, transport, healthcare, DSE,
        digital safety board, audits, environment, meetings, whistleblowing.
      </p>
    </div>
  );
}
