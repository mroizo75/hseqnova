import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, Clock } from "lucide-react";
import { SITE_CONFIG, PAGE_METADATA, getCanonicalUrl, ROBOTS_CONFIG, getOpenGraphDefaults, getTwitterDefaults } from "@/lib/seo-config";
import { londonYearMonth } from "@/lib/demo-booking";
import { BookDemoScheduler } from "@/features/demo-booking/components/book-demo-scheduler";

const pageTitle = PAGE_METADATA.bookDemo.title;
const pageDescription = PAGE_METADATA.bookDemo.description;

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: getCanonicalUrl("/book-a-demo") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(pageTitle, pageDescription, "/book-a-demo"),
  twitter: getTwitterDefaults(pageTitle, pageDescription),
};

export default function BookADemoPage() {
  const { year, month } = londonYearMonth();
  return (
    <div className="home-marketing font-marketing">
      <section className="relative overflow-hidden bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div className="container relative mx-auto px-4 py-16 lg:py-20">
          <p className="mb-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            30-minute walkthrough
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl">
            Book a demo of HSEQ Nova
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Pick a day and a time. We will send a confirmation you can add to Google, Outlook
            or Apple Calendar — or download as an ICS file. Prefer to talk first? Call or email {SITE_CONFIG.contactName}.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
            <a href={`tel:${SITE_CONFIG.contactPhoneTel}`} className="inline-flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4" />
              {SITE_CONFIG.contactPhone}
            </a>
            <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="inline-flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4" />
              {SITE_CONFIG.contactEmail}
            </a>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Monday to Friday, 9 am to 5 pm UK
            </span>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 lg:py-20">
        <BookDemoScheduler initialYear={year} initialMonth={month} />
        <div className="mt-16 grid gap-8 border-t border-[hsl(var(--home-rule))] pt-12 md:grid-cols-3">
          <div>
            <h2 className="font-display text-lg font-medium">What you will see</h2>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
              The living policy, digital accident book, RIDDOR triage and how Core sits with RAMS, COSHH and the site board.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-medium">Who it is for</h2>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
              Directors, competent persons and anyone comparing health and safety software for a UK employer.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-medium">Already decided?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
              You can{" "}
              <Link href="/register" className="text-emerald-800 underline underline-offset-2">
                start HSEQ Nova
              </Link>{" "}
              without a demo. Core is £29 a month per company, unlimited users.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
