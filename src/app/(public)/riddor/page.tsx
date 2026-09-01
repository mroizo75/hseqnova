import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  FileText,
  HardHat,
  Lock,
  Shield,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { HSEQ_CORE } from "@/lib/billing-catalog";
import { formatGbp } from "@/lib/homepage-content";
import {
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

const PAGE_TITLE =
  "Digital Accident Book and RIDDOR Reporting | HSEQ Nova";
const PAGE_DESCRIPTION =
  "Record workplace accidents in a digital accident book that meets the Social Security (Claims & Payments) Regulations 1979. Auto-classify RIDDOR 2013 events with the correct reporting deadline — without delay, 10 days or 15 days.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords:
    "digital accident book, RIDDOR reporting software, RIDDOR 2013, accident book software UK, near miss reporting, specified injury reporting, over seven day injury, dangerous occurrence reporting, workplace accident reporting",
  alternates: { canonical: getCanonicalUrl("/riddor") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, "/riddor"),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const RIDDOR_CATEGORIES = [
  {
    icon: AlertTriangle,
    title: "Deaths",
    deadline: "Without delay",
    description:
      "Report to the HSE immediately by the quickest practicable means. Follow up with a written report within 10 days.",
    regulation: "RIDDOR 2013 reg. 6(1)",
  },
  {
    icon: Siren,
    title: "Specified injuries",
    deadline: "10 days",
    description:
      "Fractures (other than fingers, thumbs, toes), amputations, loss of sight, crush injuries, scalping, burns requiring hospital admission, and other injuries listed in Schedule 1.",
    regulation: "RIDDOR 2013 reg. 4",
  },
  {
    icon: Clock,
    title: "Over-seven-day injuries",
    deadline: "15 days",
    description:
      "Where a worker is incapacitated for more than seven consecutive days (not counting the day of the accident), the employer must report within 15 days of the incident.",
    regulation: "RIDDOR 2013 reg. 4",
  },
  {
    icon: FileText,
    title: "Occupational diseases",
    deadline: "As soon as diagnosed",
    description:
      "Carpal tunnel syndrome, occupational dermatitis, hand-arm vibration syndrome, occupational asthma, tendonitis, and other diseases listed in Schedule 2.",
    regulation: "RIDDOR 2013 reg. 8",
  },
  {
    icon: Shield,
    title: "Dangerous occurrences",
    deadline: "Without delay",
    description:
      "Collapse of scaffolding, failure of a pressure vessel, electrical short circuit causing fire, collapse of a building, and other events listed in Schedule 2.",
    regulation: "RIDDOR 2013 reg. 7",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Log the incident",
    text: "A first aider or supervisor records the event in the digital accident book — injury type, location, persons involved and immediate actions taken.",
  },
  {
    n: "02",
    title: "Auto-classify",
    text: "HSEQ Nova checks whether the event is reportable under RIDDOR 2013 and assigns the correct reporting clock: without delay, 10 days, or 15 days.",
  },
  {
    n: "03",
    title: "Flag the deadline",
    text: "Reportable events appear on the HSEQ cockpit with a countdown. The responsible person sees the clock before it expires, not after.",
  },
  {
    n: "04",
    title: "Track to closure",
    text: "Record investigation findings, corrective actions and root cause. Close the entry when the work is done and keep the audit trail.",
  },
] as const;

const FEATURES = [
  {
    icon: BookOpen,
    title: "Digital accident book",
    text: "Replaces the paper BI 510 pad. Every entry is timestamped, attributed and stored digitally — meeting the Social Security (Claims and Payments) Regulations 1979.",
  },
  {
    icon: Clock,
    title: "RIDDOR deadline tracking",
    text: "Reportable events are flagged with the correct clock. Deaths and dangerous occurrences are flagged for immediate reporting; specified injuries for 10 days; over-seven-day injuries for 15 days.",
  },
  {
    icon: Siren,
    title: "Near miss recording",
    text: "Near misses are not reportable under RIDDOR, but recording them is widely recognised as good practice. HSEQ Nova keeps them in the same system without triggering a false RIDDOR deadline.",
  },
  {
    icon: Lock,
    title: "Personal data kept private",
    text: "Accident book entries contain personal details — name, address, injury description. HSEQ Nova keeps this data off the public safety board and controls access by role.",
  },
  {
    icon: Shield,
    title: "Three-year retention",
    text: "Accident book records must be kept for at least three years from the date of the last entry. Digital storage removes the risk of a misplaced pad or water-damaged paper.",
  },
  {
    icon: FileText,
    title: "Audit trail",
    text: "Every edit is logged. If an inspector or insurer asks who recorded what and when, the record is already there.",
  },
] as const;

const FAQS = [
  {
    question: "Do I need a paper accident book or can it be digital?",
    answer:
      "The Social Security (Claims and Payments) Regulations 1979 require employers with 10 or more employees to keep an accident book. The regulations do not require it to be paper — a digital record is lawful provided it captures the same information (date, time, injured person, nature of injury, circumstances) and is kept for at least three years.",
  },
  {
    question: "What must be reported under RIDDOR 2013?",
    answer:
      "RIDDOR 2013 requires employers to report deaths, specified injuries (listed in Schedule 1), over-seven-day incapacitation, certain occupational diseases, dangerous occurrences and gas-related incidents. Near misses are not reportable under RIDDOR but should still be recorded in the accident book.",
  },
  {
    question:
      "What is the difference between the 10-day and 15-day RIDDOR deadline?",
    answer:
      "Deaths and specified injuries must be reported within 10 days of the incident (deaths must also be reported without delay by the quickest practicable means). Over-seven-day injuries — where the worker is incapacitated for more than seven consecutive days — must be reported within 15 days of the incident, not 15 days from the seventh day off.",
  },
  {
    question: "Does HSEQ Nova report directly to the HSE?",
    answer:
      "No. The responsible person must submit the report to the HSE through the official online reporting form at the HSE website. HSEQ Nova tracks the event, classifies it and counts down the deadline so you can prepare the report before the clock expires.",
  },
  {
    question: "Is the accident book part of HSEQ Nova Core?",
    answer: `Yes. The digital accident book and RIDDOR triage are included in HSEQ Nova Core at ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month (excluding VAT) with unlimited users. There is no additional charge for RIDDOR deadline tracking.`,
  },
] as const;

function getStructuredData(): Array<Record<string, unknown>> {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/riddor/#webpage`,
      url: `${SITE_CONFIG.url}/riddor`,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      inLanguage: "en-GB",
      isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];
}

export default function RiddorPage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={getStructuredData()} />
      <Hero />
      <LegalStrip />
      <RiddorCategories />
      <HowItWorks />
      <FeaturesGrid />
      <FaqSection />
      <FinalCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Included in HSEQ Nova Core
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            Digital accident book and RIDDOR reporting
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Record workplace accidents in a digital accident book that meets the
            Social Security (Claims &amp; Payments) Regulations 1979. When an event is
            reportable under RIDDOR 2013, the system flags the correct deadline
            so the clock never runs out unnoticed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              <Link href="/register">
                Start HSEQ Nova
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/60">
            {formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month per company, unlimited
            users. No extra cost for RIDDOR.
          </p>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-riddor.jpg"
              alt="First aider recording an accident in a digital accident book on a tablet"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">
                Digital accident book on any device
              </p>
              <p className="text-xs text-white/75">
                Log injuries and near misses in minutes, not the time it takes
                to find the paper pad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegalStrip() {
  const duties = [
    "RIDDOR 2013",
    "Social Security (Claims & Payments) Regs 1979",
    "HSWA 1974",
    "MHSWR 1999",
  ];
  return (
    <div className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-[hsl(var(--home-ink)/0.7)]">
        {duties.map((duty) => (
          <span key={duty} className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-700"
              aria-hidden
            />
            {duty}
          </span>
        ))}
      </div>
    </div>
  );
}

function RiddorCategories() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          RIDDOR 2013
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Five categories of reportable event
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          The Reporting of Injuries, Diseases and Dangerous Occurrences
          Regulations 2013 set out which workplace events must be reported to
          the HSE and within which time frame.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RIDDOR_CATEGORIES.map((cat) => (
          <article
            key={cat.title}
            className="border border-[hsl(var(--home-rule))] bg-white p-7"
          >
            <div className="flex items-center gap-3">
              <cat.icon
                className="h-5 w-5 shrink-0 text-emerald-800"
                aria-hidden
              />
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
                {cat.deadline}
              </p>
            </div>
            <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
              {cat.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {cat.description}
            </p>
            <p className="mt-3 text-xs text-[hsl(var(--home-ink)/0.5)]">
              {cat.regulation}
            </p>
          </article>
        ))}
        <article className="flex flex-col justify-center border border-dashed border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Not RIDDOR
          </p>
          <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
            Near misses
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
            Near misses are not reportable under RIDDOR, but recording them is
            widely recognised as good practice and supports a culture of
            proactive reporting. HSEQ Nova logs them alongside injuries without
            triggering a false RIDDOR deadline.
          </p>
        </article>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            From incident to closure in four steps
          </h2>
          <p className="mt-4 text-white/70">
            The system handles the classification and the clock. Your team
            handles the investigation and the actions.
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article
              key={step.n}
              className="border-t border-white/15 pt-6"
            >
              <p className="font-display text-sm tracking-[0.2em] text-emerald-300">
                {step.n}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Included in Core
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          What the digital accident book gives you
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          Every feature below is part of HSEQ Nova Core at{" "}
          {formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month with unlimited
          users. No add-on required.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] p-7"
          >
            <feature.icon
              className="h-5 w-5 text-emerald-800"
              aria-hidden
            />
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {feature.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-[hsl(var(--home-rule))] bg-white py-20 lg:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-[hsl(var(--home-ink)/0.7)]">
          Common questions about accident books, RIDDOR 2013 and how HSEQ Nova
          handles incident reporting.
        </p>
        <div className="mt-10 divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  className="shrink-0 text-2xl font-light leading-none text-emerald-800 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-20">
      <div className="container mx-auto overflow-hidden bg-[hsl(var(--home-ink))] px-8 py-14 text-[hsl(var(--home-ink-fg))] md:px-14 md:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-200">
              <HardHat className="h-4 w-4" aria-hidden />
              Part of HSEQ Nova Core — no extra cost
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Replace the paper accident book today
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Log injuries and near misses digitally. If an event is reportable
              under RIDDOR, the deadline is already running in the system.{" "}
              {formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month, unlimited
              users. Stripe Tax applies reverse charge for UK VAT-registered customers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              >
                <Link href="/register">
                  Start HSEQ Nova
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <ul className="space-y-3 text-sm text-white/80">
              {[
                "Digital accident book — replaces the paper pad",
                "RIDDOR deadline tracking built in",
                "Near misses recorded without false alerts",
                "Personal data kept off the safety board",
                "Three-year retention as standard",
                "Unlimited users at no extra cost",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
