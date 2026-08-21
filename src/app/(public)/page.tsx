import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG, PAGE_METADATA, getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: PAGE_METADATA.home.title,
  description: PAGE_METADATA.home.description,
  alternates: { canonical: getCanonicalUrl("/") },
  robots: ROBOTS_CONFIG,
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 pt-16 pb-20 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-4">HSEQ software for UK employers</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Health and safety software that matches how UK law actually works
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Digital accident book and RIDDOR triage, a living health and safety policy, workplace inspections,
          training and fire drills — priced per company with unlimited users. RAMS, COSHH, CDM and the
          digital safety board are add-ons.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/register">Start a trial</Link>
          </Button>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-20 grid gap-6 md:grid-cols-3">
        {[
          { href: "/riddor", title: "Accident book + RIDDOR", text: "Record injuries and near misses. Reportable events get the right deadline." },
          { href: "/rams", title: "RAMS and COSHH", text: "Risk assessments, method statements and COSHH as industry add-ons." },
          { href: "/digital-safety-board", title: "Digital safety board", text: "Site induction, F10, CPP and first aiders on a public board — no personal data on screen." },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="rounded-xl border p-6 hover:bg-muted/40">
            <h2 className="font-semibold mb-2">{card.title}</h2>
            <p className="text-sm text-muted-foreground">{card.text}</p>
          </Link>
        ))}
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {SITE_CONFIG.name} · {SITE_CONFIG.contactEmail}
      </footer>
    </div>
  );
}
