import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  FolderOpen,
  HardHat,
  Layers,
  Link2,
  MapPin,
  Shield,
  Users,
  Wrench,
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

const ramsPack = ADDON_PACKS.find((p) => p.id === "rams")!;

const PAGE_TITLE =
  "RAMS Software — Risk Assessments and Method Statements | HSEQ Nova";
const PAGE_DESCRIPTION =
  "Create task-level risk assessments and method statements linked to live projects. RAMS add-on for HSEQ Nova at £15/month — built for MHSWR 1999 and CDM 2015 construction duties.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords:
    "RAMS software, risk assessment and method statement, RAMS construction, MHSWR 1999 risk assessment, CDM 2015 RAMS, method statement software UK, site-specific risk assessment, task risk assessment software",
  alternates: { canonical: getCanonicalUrl("/rams") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, "/rams"),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const LEGAL_CONTEXT = [
  {
    regulation: "MHSWR 1999 reg. 3",
    title: "Suitable and sufficient risk assessment",
    text: "Every employer must carry out a suitable and sufficient assessment of the risks to employees and anyone else affected by the work. Where there are five or more employees, the assessment must be recorded.",
  },
  {
    regulation: "CDM 2015 reg. 13",
    title: "Duties of contractors",
    text: "Contractors must plan, manage and monitor their own work so it is carried out without risks to health and safety. Site-specific RAMS demonstrate this duty in practice.",
  },
  {
    regulation: "CDM 2015 reg. 15",
    title: "Duties of workers",
    text: "Workers must follow the method statement and report anything they believe to be a risk. A clear, accessible method statement is a precondition for this duty.",
  },
] as const;

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Task-level risk assessments",
    text: "Create risk assessments for specific tasks — not generic office templates. Each assessment has hazards, controls and a residual risk score that updates as controls are applied.",
  },
  {
    icon: FileText,
    title: "Linked method statements",
    text: "The method statement sits beside the risk assessment, not in a separate Word file. When the hazard list changes, the method statement is in the same view.",
  },
  {
    icon: MapPin,
    title: "Assign to sites and projects",
    text: "Link each RAMS to a site, a project, or both. Supervisors see only the assessments relevant to the work they are managing, not the full company library.",
  },
  {
    icon: Shield,
    title: "Live, not static",
    text: "RAMS in HSEQ Nova are living documents. Update a control, add a new hazard, record a near miss against the assessment — the history is kept, not overwritten.",
  },
  {
    icon: Users,
    title: "Worker sign-off",
    text: "Site teams can acknowledge the RAMS before starting work. The acknowledgement is recorded with a timestamp and stored alongside the assessment.",
  },
  {
    icon: Link2,
    title: "Works with CDM 2015",
    text: "When the CDM add-on is also active, RAMS link to CDM duty holders, the construction phase plan and the health and safety file. Two packs, one joined-up record.",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Create the assessment",
    text: "Start from a blank assessment or duplicate an existing one. Add hazards, assign severity and likelihood, and define the controls that reduce the risk.",
  },
  {
    n: "02",
    title: "Write the method statement",
    text: "Describe the safe system of work step by step. The method statement sits in the same record as the risk assessment — no separate folder to manage.",
  },
  {
    n: "03",
    title: "Assign and brief",
    text: "Link the RAMS to a project or site. Workers acknowledge the document before starting the task. The briefing record is stored automatically.",
  },
  {
    n: "04",
    title: "Review and update",
    text: "When conditions change — new plant, different ground conditions, a near miss — update the RAMS. The previous version is kept in the history.",
  },
] as const;

const FAQS = [
  {
    question: "What is a RAMS?",
    answer:
      "RAMS stands for Risk Assessment and Method Statement. The risk assessment identifies hazards and controls. The method statement describes the safe system of work step by step. Together, they show how a task will be carried out safely. RAMS are commonly required on construction sites under CDM 2015, but the underlying duty to assess risk comes from MHSWR 1999 and applies to all employers.",
  },
  {
    question: "Is a RAMS legally required?",
    answer:
      "A risk assessment is legally required under MHSWR 1999 regulation 3. A method statement is not explicitly required by a single regulation, but CDM 2015 regulation 13 requires contractors to plan, manage and monitor construction work — and a written method statement is the standard way to demonstrate this. Many principal contractors require RAMS before permitting work to start on site.",
  },
  {
    question: "Can I use RAMS without the CDM add-on?",
    answer: `Yes. The RAMS add-on at ${formatGbp(ramsPack.monthlyPriceGbp)} per month works independently. It covers task-level risk assessments and method statements. If you also need CDM duty holder tracking, the construction phase plan and the health and safety file, add the CDM pack as well — the two work together.`,
  },
  {
    question: "How does HSEQ Nova differ from a Word template?",
    answer:
      "A Word file is a snapshot. Once it is saved, it does not change when conditions on site change. HSEQ Nova keeps the RAMS as a live record: update a control, add a hazard, record a near miss against it, and the history is kept. Worker sign-off is timestamped and stored in the same system.",
  },
  {
    question: "What does the RAMS add-on cost?",
    answer: `The RAMS add-on is ${formatGbp(ramsPack.monthlyPriceGbp)} per month excluding VAT, on top of HSEQ Nova Core at ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month. Unlimited users are included in the Core price — there is no per-seat charge for RAMS.`,
  },
] as const;

function getStructuredData(): Array<Record<string, unknown>> {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/rams/#webpage`,
      url: `${SITE_CONFIG.url}/rams`,
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

export default function RamsPage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={getStructuredData()} />
      <Hero />
      <LegalStrip />
      <LegalContext />
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
            Construction add-on · {formatGbp(ramsPack.monthlyPriceGbp)}/month
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            RAMS that live with the work, not in a folder
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Create task-level risk assessments and method statements linked to
            live projects. Update hazards, record sign-off, and keep the history
            — instead of emailing a new version of a Word file every time
            conditions change.
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
              src="/images/hero-rams.jpg"
              alt="Supervisor reviewing a risk assessment and method statement on a tablet at a construction site"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">
                Live RAMS on site
              </p>
              <p className="text-xs text-white/75">
                Risk assessments and method statements that update when
                conditions change.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegalStrip() {
  const duties = ["MHSWR 1999", "CDM 2015", "HSWA 1974"];
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

function LegalContext() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          The legal duty
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Why RAMS exist and what the law requires
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          RAMS are the practical demonstration of two legal duties: the duty to
          assess risk (MHSWR 1999) and the duty to plan and manage construction
          work safely (CDM 2015).
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {LEGAL_CONTEXT.map((item) => (
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
            From hazard identification to site briefing
          </h2>
          <p className="mt-4 text-white/70">
            RAMS in HSEQ Nova follow a four-step cycle that keeps the assessment
            current for as long as the task is live.
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
          RAMS features in HSEQ Nova
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          Built for construction teams who need RAMS that match the task and the
          site — not a generic template.
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
          Common questions about RAMS, the legal duty to assess risk, and how
          HSEQ Nova handles method statements.
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
              RAMS add-on · {formatGbp(ramsPack.monthlyPriceGbp)}/month
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Move RAMS out of the shared drive
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Task-level risk assessments and method statements that live with
              the project, update when conditions change, and record who was
              briefed. Add the RAMS pack to HSEQ Nova Core for{" "}
              {formatGbp(ramsPack.monthlyPriceGbp)} per month excluding VAT.
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
                "Task-level risk assessments, not generic templates",
                "Method statements linked to the assessment",
                "Assigned to sites and projects",
                "Worker sign-off with timestamp",
                "Version history on every change",
                "Works with CDM 2015 when both packs are active",
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
