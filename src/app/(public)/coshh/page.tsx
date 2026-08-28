import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  BookOpen,
  Check,
  ClipboardCheck,
  Clock,
  FileText,
  FlaskConical,
  HardHat,
  Heart,
  Search,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { ADDON_PACKS, HSEQ_CORE, UK_VAT_PERCENT } from "@/lib/billing-catalog";
import { formatGbp } from "@/lib/homepage-content";
import {
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

const coshhPack = ADDON_PACKS.find((p) => p.id === "coshh")!;

const PAGE_TITLE =
  "COSHH Assessment Software — Hazardous Substances | HSEQ Nova";
const PAGE_DESCRIPTION =
  "Carry out COSHH assessments, manage safety data sheets and keep health records for 40 years. COSHH add-on for HSEQ Nova at £19/month — built for the Control of Substances Hazardous to Health Regulations 2002.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords:
    "COSHH assessment software, COSHH 2002, hazardous substances software UK, safety data sheet management, SDS management software, health surveillance records, COSHH register, exposure register, occupational health records 40 years",
  alternates: { canonical: getCanonicalUrl("/coshh") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, "/coshh"),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const COSHH_DUTIES = [
  {
    regulation: "COSHH 2002 reg. 6",
    title: "Assessment",
    text: "A suitable and sufficient assessment of the risk to health must be carried out before any work with a hazardous substance begins. The assessment must be reviewed regularly and whenever there is reason to suspect it is no longer valid.",
  },
  {
    regulation: "COSHH 2002 reg. 7",
    title: "Prevention and control",
    text: "Exposure must be prevented or, where that is not reasonably practicable, adequately controlled. The hierarchy of control applies: elimination, substitution, engineering controls, administrative controls, and lastly personal protective equipment.",
  },
  {
    regulation: "COSHH 2002 reg. 11",
    title: "Health surveillance",
    text: "Where the assessment identifies a risk to health and there is a valid technique for detecting the disease or condition, the employer must ensure health surveillance is carried out. Health records from surveillance must be kept for at least 40 years.",
  },
] as const;

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "COSHH assessments",
    text: "Structured assessments that follow the eight steps set out in the HSE's COSHH essentials guidance. Record the substance, the hazard, the route of exposure, the people at risk, and the controls in place.",
  },
  {
    icon: FileText,
    title: "Safety data sheet management",
    text: "Upload and store safety data sheets (SDS) against each substance. The SDS is accessible from the assessment, so the information the workforce needs is in one place.",
  },
  {
    icon: BookOpen,
    title: "COSHH register",
    text: "A central register of every hazardous substance used in the workplace. See which substances are in use, which assessments cover them, and when each assessment was last reviewed.",
  },
  {
    icon: Heart,
    title: "Health records — 40-year retention",
    text: "Where health surveillance is required, HSEQ Nova stores the individual health record. COSHH 2002 regulation 11(4) requires these records to be kept for at least 40 years from the date of the last entry.",
  },
  {
    icon: Search,
    title: "Exposure register",
    text: "Record which workers are exposed to which substances, the duration and the level of exposure. The exposure register supports both the COSHH assessment and the health surveillance programme.",
  },
  {
    icon: Shield,
    title: "Review reminders",
    text: "Assessments must be reviewed regularly and whenever there is reason to suspect they are no longer valid. HSEQ Nova tracks review dates and flags overdue assessments on the HSEQ cockpit.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Identify the substance",
    text: "Add the hazardous substance to the COSHH register. Upload the safety data sheet and record the hazard classification, route of exposure and workplace exposure limit if one exists.",
  },
  {
    n: "02",
    title: "Carry out the assessment",
    text: "Create a COSHH assessment. Identify who is at risk, the tasks that involve exposure, and the controls that prevent or adequately control exposure. Set a review date.",
  },
  {
    n: "03",
    title: "Record exposure and surveillance",
    text: "Where health surveillance is required, record results against individual workers. The exposure register links the worker, the substance, and the assessment.",
  },
  {
    n: "04",
    title: "Review and update",
    text: "When the assessment is due for review — or when a new substance, a change in process or a health surveillance result triggers a review — update the assessment and keep the history.",
  },
] as const;

const FAQS = [
  {
    question: "What does COSHH stand for?",
    answer:
      "COSHH stands for the Control of Substances Hazardous to Health. The COSHH Regulations 2002 (as amended) set out the duties on employers to assess, prevent or control exposure to hazardous substances in the workplace. These include chemicals, fumes, dusts, vapours, biological agents and nanotechnology particles.",
  },
  {
    question: "When is a COSHH assessment required?",
    answer:
      "A COSHH assessment is required before any work begins that involves, or may involve, exposure to a substance hazardous to health. Regulation 6 of COSHH 2002 requires the assessment to be suitable and sufficient — it must identify the hazards, who is at risk, and the controls needed. Where there are five or more employees, the assessment must be recorded.",
  },
  {
    question: "How long must COSHH health records be kept?",
    answer:
      "Under COSHH 2002 regulation 11(4), individual health records from health surveillance must be kept for at least 40 years from the date of the last entry. This is significantly longer than most other workplace records and is one of the reasons a digital system with long-term retention is important.",
  },
  {
    question: "What is a safety data sheet (SDS)?",
    answer:
      "A safety data sheet is a document provided by the supplier of a chemical product. It contains 16 sections covering identification, hazards, composition, first aid, fire-fighting, handling, exposure controls, physical properties, stability, toxicology, ecology, disposal, transport, regulation and other information. The SDS is the starting point for any COSHH assessment.",
  },
  {
    question: "What does the COSHH add-on cost?",
    answer: `The COSHH add-on is ${formatGbp(coshhPack.monthlyPriceGbp)} per month excluding VAT, on top of HSEQ Nova Core at ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month. Unlimited users are included in the Core price. The add-on covers COSHH assessments, the substance register, safety data sheet storage, the exposure register and health records with 40-year retention.`,
  },
] as const;

function getStructuredData(): Array<Record<string, unknown>> {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/coshh/#webpage`,
      url: `${SITE_CONFIG.url}/coshh`,
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

export default function CoshhPage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={getStructuredData()} />
      <Hero />
      <LegalStrip />
      <LegalDuties />
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
            Hazardous substances add-on · {formatGbp(coshhPack.monthlyPriceGbp)}
            /month
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            COSHH assessments and health records in one system
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Carry out suitable and sufficient COSHH assessments, store safety
            data sheets, track exposure and keep health surveillance records for
            the 40 years the law requires — all in HSEQ Nova.
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
            Requires HSEQ Nova Core ({formatGbp(HSEQ_CORE.monthlyPriceGbp)}
            /month). Unlimited users included.
          </p>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-coshh.jpg"
              alt="Worker in protective equipment reviewing a COSHH assessment on a tablet beside chemical storage"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">
                COSHH register and assessments
              </p>
              <p className="text-xs text-white/75">
                Every substance, every assessment, every health record — in one
                place.
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
    "COSHH 2002",
    "MHSWR 1999",
    "HSWA 1974 s.2(2)(c)",
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

function LegalDuties() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          The legal duty
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          What COSHH 2002 requires from employers
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          The Control of Substances Hazardous to Health Regulations 2002 place
          three core duties on employers: assess the risk, prevent or control
          exposure, and carry out health surveillance where required.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {COSHH_DUTIES.map((item) => (
          <article
            key={item.regulation}
            className="border border-[hsl(var(--home-rule))] bg-white p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">
              {item.regulation}
            </p>
            <h3 className="mt-4 font-display text-xl font-medium tracking-tight">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {item.text}
            </p>
          </article>
        ))}
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
            From substance identification to long-term health records
          </h2>
          <p className="mt-4 text-white/70">
            HSEQ Nova follows the COSHH lifecycle: identify the substance,
            assess the risk, record exposure, and keep health records for as
            long as the law requires.
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
          What you get
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          COSHH features in HSEQ Nova
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          Everything an employer needs to meet the assessment, control and
          surveillance duties under COSHH 2002.
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
          Common questions about COSHH, hazardous substances and how HSEQ Nova
          handles assessments and health records.
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
              <FlaskConical className="h-4 w-4" aria-hidden />
              COSHH add-on · {formatGbp(coshhPack.monthlyPriceGbp)}/month
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Get COSHH right — and keep the records for 40 years
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Assessments, safety data sheets, exposure records and health
              surveillance in one system. Add the COSHH pack to HSEQ Nova Core
              for {formatGbp(coshhPack.monthlyPriceGbp)} per month excluding
              VAT.
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
                "COSHH assessments following HSE guidance",
                "Safety data sheet storage per substance",
                "Central COSHH register",
                "Exposure register for individual workers",
                "Health records retained for 40 years",
                "Review reminders on the HSEQ cockpit",
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
