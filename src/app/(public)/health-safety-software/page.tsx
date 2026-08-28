import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ClipboardCheck,
  Factory,
  Flame,
  GraduationCap,
  HardHat,
  Shield,
  Siren,
  Truck,
  Warehouse,
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

const PAGE_TITLE = "Health and Safety Software for UK Employers | HSEQ Nova";
const PAGE_DESCRIPTION =
  "HSEQ software built around UK duties: HSWA, MHSWR, RIDDOR, COSHH, CDM 2015 and the Fire Safety Order. Modular — Core for every employer, add-ons for construction, chemicals and site boards. From £29/month.";
const PAGE_PATH = "/health-safety-software";
const PAGE_KEYWORDS =
  "health and safety software UK, HSEQ software, H&S software for employers, HSWA software, RIDDOR software, CHAS evidence, Constructionline, SSIP, SafeContractor, ISO 45001 software";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: PAGE_KEYWORDS,
  alternates: { canonical: getCanonicalUrl(PAGE_PATH) },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const DUTY_MAP = [
  {
    law: "HSWA 1974 s.2(3)",
    duty: "Written health and safety policy",
    feature: "Living policy: statement, organisation, arrangements",
    module: "Core",
  },
  {
    law: "MHSWR 1999 reg.3",
    duty: "Suitable and sufficient risk assessments",
    feature: "Risk assessments with 5×5 matrix and review dates",
    module: "Core",
  },
  {
    law: "MHSWR 1999 reg.7",
    duty: "Appoint competent person(s)",
    feature: "Organisation chart showing the competent person",
    module: "Core",
  },
  {
    law: "RIDDOR 2013",
    duty: "Report deaths, specified injuries, over-7-day, disease, dangerous occurrences",
    feature: "Digital accident book with RIDDOR triage and clocks",
    module: "Core",
  },
  {
    law: "Accident book (SS regs 1979)",
    duty: "Record all workplace injuries",
    feature: "Digital accident book — replaces the BI 510 pad",
    module: "Core",
  },
  {
    law: "HSWA 1974 s.2(2)(c)",
    duty: "Information, instruction, training, supervision",
    feature: "Training records with expiry tracking",
    module: "Core",
  },
  {
    law: "Fire Safety Order 2005",
    duty: "Fire drills and emergency procedures",
    feature: "Fire drill log with dates, participants and issues",
    module: "Core",
  },
  {
    law: "COSHH 2002",
    duty: "Assess and control exposure to hazardous substances",
    feature: "COSHH assessments, register and health records (40 yr)",
    module: "COSHH add-on",
  },
  {
    law: "CDM 2015",
    duty: "Client, PD, PC duties; CPP; F10; H&S file",
    feature: "Duty holder roles, construction phase plan, F10, H&S file",
    module: "CDM add-on",
  },
  {
    law: "CDM 2015 site info",
    duty: "Site rules, induction, emergency procedures at the gate",
    feature: "Digital safety board with kiosk and QR access",
    module: "Safety board add-on",
  },
] as const;

const SECTORS = [
  {
    icon: HardHat,
    title: "Construction",
    text: "Core for every site, CDM add-on for duty holders, RAMS for task-level assessments, and the digital safety board at the gate. Evidence for CHAS, Constructionline and SafeContractor.",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    text: "Risk assessments, COSHH for chemicals, workplace inspections for the factory floor, and a training matrix to track operator competence.",
  },
  {
    icon: Warehouse,
    title: "Warehousing and logistics",
    text: "Incident reporting for FLT incidents, fire drills, risk assessments for racking and manual handling, and the accident book in a supervisor's pocket.",
  },
  {
    icon: Building2,
    title: "Facilities management",
    text: "Multi-site inspections, fire drill records, training for cleaning and maintenance teams, and a living policy the FM director can actually point to.",
  },
  {
    icon: Wrench,
    title: "Trades and SMEs",
    text: "A policy that satisfies HSWA s.2(3), an accident book and risk assessments — without a system built for a thousand-person company.",
  },
] as const;

const SSIP_SCHEMES = [
  { name: "CHAS", full: "Contractors Health and Safety Assessment Scheme" },
  { name: "Constructionline", full: "Government-backed prequalification" },
  { name: "SafeContractor", full: "Alcumus SafeContractor accreditation" },
  { name: "SMAS", full: "Safety Management Advisory Services" },
  { name: "CQMS", full: "Construction Qualification & Monitoring Service" },
] as const;

const CORE_FEATURES = [
  { icon: BookOpen, label: "Living H&S policy", hook: "HSWA s.2(3)" },
  { icon: Siren, label: "Accident book + RIDDOR", hook: "RIDDOR 2013" },
  { icon: Shield, label: "Risk assessments", hook: "MHSWR 1999" },
  { icon: ClipboardCheck, label: "Workplace inspections", hook: "MHSWR 1999" },
  { icon: Flame, label: "Fire drills", hook: "Fire Safety Order 2005" },
  { icon: GraduationCap, label: "Training records", hook: "HSWA s.2(2)(c)" },
] as const;

const ADDON_HREFS: Record<string, string> = {
  rams: "/rams",
  coshh: "/coshh",
  cdm: "/pricing",
  "safety-board": "/digital-safety-board",
  audits: "/pricing",
  environment: "/pricing",
};

const FAQS = [
  {
    question: "What UK laws does HSEQ Nova cover?",
    answer:
      "Core covers the duties most employers share: HSWA 1974 (written policy), MHSWR 1999 (risk assessments, competent person), RIDDOR 2013 (accident book and reportable events), the Fire Safety Order 2005 (fire drills) and HSWA s.2(2)(c) (training). Add-ons cover COSHH 2002 (hazardous substances) and CDM 2015 (construction duty holders).",
  },
  {
    question: "Is HSEQ Nova consultancy or a competent person?",
    answer:
      "Neither. HSEQ Nova is the system your competent person and managers use to keep records, run assessments and follow through on actions. It does not replace the legal duty to appoint competent help (MHSWR regulation 7), and it is not health and safety consultancy.",
  },
  {
    question: "How does HSEQ Nova help with CHAS, Constructionline or SafeContractor?",
    answer:
      "SSIP assessors look for evidence: a signed policy, current risk assessments, training records, inspection history and an accident book. HSEQ Nova keeps all of that in one system. You can share a link or export a PDF for each evidence point, instead of rebuilding a file from scattered documents.",
  },
  {
    question: "Do I need every add-on?",
    answer:
      "No. Core handles the duties every employer has. Switch on RAMS when a site needs method statements. Switch on COSHH when the work involves hazardous substances. Switch on CDM when you take on a duty holder role. Switch on the safety board when you need a display at the gate. You only pay for what the work requires.",
  },
  {
    question: "How much does HSEQ Nova cost?",
    answer: `Core is ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month excluding ${UK_VAT_PERCENT}% VAT, per company, with unlimited users. Add-ons range from ${formatGbp(15)} to ${formatGbp(30)} per month. There is no per-seat charge, so every supervisor, first aider and director can log in without affecting the price.`,
  },
  {
    question: "Can I use HSEQ Nova for ISO 45001?",
    answer:
      "HSEQ Nova covers much of what an occupational health and safety management system requires — policy, risk assessments, incident management, inspections, training and actions. The optional audits add-on adds internal audits and management review. Certification itself is granted by a UKAS-accredited body, not by software.",
  },
  {
    question: "What industries is HSEQ Nova suitable for?",
    answer:
      "Any UK employer with health and safety duties — which is every employer. Core is industry-neutral. The add-ons tailor the system for construction (CDM, RAMS, safety board), chemical users (COSHH) and companies pursuing ISO 45001 or 14001 (audits, environment).",
  },
] as const;

function getJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}${PAGE_PATH}/#webpage`,
      url: `${SITE_CONFIG.url}${PAGE_PATH}`,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      inLanguage: "en-GB",
      isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "HSEQ Nova",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PAGE_DESCRIPTION,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "GBP",
        lowPrice: String(HSEQ_CORE.monthlyPriceGbp),
        highPrice: String(
          HSEQ_CORE.monthlyPriceGbp +
            ADDON_PACKS.reduce((sum, p) => sum + p.monthlyPriceGbp, 0)
        ),
        offerCount: 1 + ADDON_PACKS.length,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ] as Array<Record<string, unknown>>;
}

export default function HealthSafetySoftwarePage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={getJsonLd()} />
      <Hero />
      <CoreStrip />
      <DutyMapSection />
      <ModularSection />
      <SectorsSection />
      <SsipSection />
      <NotConsultancy />
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
            HSEQ software for the UK
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            Health and safety software built around UK employer duties
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Written policy, accident book, risk assessments, inspections, training and fire
            drills in one system. Add RAMS, COSHH, CDM or the site board when the work
            needs them. Priced per company, not per seat.
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
            Core {formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month ex VAT · unlimited users
          </p>
        </div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-software.jpg"
              alt="HSEQ Nova dashboard on a laptop showing health and safety modules"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">One system for the duties you already have</p>
              <p className="text-xs text-white/75">
                Policy, accident book, inspections, training and fire drills — then add-ons when needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreStrip() {
  return (
    <div className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-3 lg:grid-cols-6">
        {CORE_FEATURES.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-sm">
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
            <span>
              <span className="block font-medium">{item.label}</span>
              <span className="text-xs text-[hsl(var(--home-ink)/0.6)]">{item.hook}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DutyMapSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Features mapped to legislation
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          Every feature exists because a duty requires it
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          HSEQ Nova is not a generic checklist tool. Each module maps to a specific UK
          legal duty. If the law does not require it, it is either clearly optional or it
          is not in the system.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-5xl overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--home-rule))] text-left text-xs font-semibold uppercase tracking-[0.14em]">
              <th className="py-3 pr-4">Law / regulation</th>
              <th className="py-3 pr-4">Duty</th>
              <th className="py-3 pr-4">HSEQ Nova feature</th>
              <th className="py-3">Module</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--home-rule))]">
            {DUTY_MAP.map((row) => (
              <tr key={row.law}>
                <td className="py-3 pr-4 font-medium">{row.law}</td>
                <td className="py-3 pr-4 text-[hsl(var(--home-ink)/0.7)]">{row.duty}</td>
                <td className="py-3 pr-4">{row.feature}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      row.module === "Core"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {row.module}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ModularSection() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Modular by design
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Core for every employer — add-ons when the work requires them
          </h2>
          <p className="mt-4 text-white/75">
            Every UK employer has duties under HSWA. Not every employer needs COSHH
            assessments or a construction phase plan. HSEQ Nova keeps Core lean and
            adds industry packs only when the work asks for them.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-sm border border-white/10 bg-white/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Core · {formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month · unlimited users
            </p>
            <p className="mt-2 text-sm text-white/70">{HSEQ_CORE.description}</p>
          </div>
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {ADDON_PACKS.map((pack) => (
              <li key={pack.id}>
                <Link
                  href={ADDON_HREFS[pack.id] ?? "/pricing"}
                  className="flex items-baseline justify-between gap-4 py-4 hover:text-emerald-300"
                >
                  <span>
                    <span className="block font-medium">{pack.name}</span>
                    <span className="mt-1 block text-sm text-white/60">
                      {pack.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatGbp(pack.monthlyPriceGbp)}/mo
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SectorsSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Suitable for
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          From a five-person trade firm to a multi-site contractor
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          Core is the same for every employer. The add-ons tailor the system to the
          industry. The price is per company, so a 200-person firm pays the same as a
          five-person one.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {SECTORS.map((sector) => (
          <article key={sector.title} className="border-t border-[hsl(var(--home-rule))] pt-5">
            <sector.icon className="h-5 w-5 text-emerald-700" aria-hidden />
            <h3 className="mt-3 font-semibold">{sector.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {sector.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SsipSection() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[1fr_1fr] lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Evidence for SSIP schemes
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Build the evidence file as you work, not the week before the audit
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
            CHAS, Constructionline, SafeContractor and other SSIP schemes ask for proof
            that you have a policy, risk assessments, training records, an accident book
            and inspections. When everything is in one system, the evidence is already
            there — you share a link or export a PDF.
          </p>
        </div>
        <div>
          <ul className="divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
            {SSIP_SCHEMES.map((scheme) => (
              <li key={scheme.name} className="flex items-start gap-3 py-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span>
                  <span className="block font-medium">{scheme.name}</span>
                  <span className="text-sm text-[hsl(var(--home-ink)/0.65)]">
                    {scheme.full}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[hsl(var(--home-ink)/0.6)]">
            HSEQ Nova is not an SSIP body. It is the system that holds the evidence
            these schemes ask for.
          </p>
        </div>
      </div>
    </section>
  );
}

function NotConsultancy() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          What HSEQ Nova is — and is not
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          The system your competent person uses
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          HSEQ Nova does not replace the legal duty to appoint one or more competent
          persons (MHSWR regulation 7). It is not consultancy, and it does not tell you
          what your risk assessments should say.
        </p>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          What it does is give your competent person, supervisors and directors a system
          where the policy, the accident book, assessments, inspections, training and fire
          drills live together — so the weekly HSEQ job is the work, not the filing.
        </p>
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
          Common questions about how HSEQ Nova maps to UK law, what is included and
          what it costs.
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
              Built for UK employer duties
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              One system for the duties you already have
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Core at {formatGbp(HSEQ_CORE.monthlyPriceGbp)} a month. Unlimited users.
              Add RAMS, COSHH, CDM or the safety board when a contract or a substance
              asks for them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              >
                <Link href="/register">Start HSEQ Nova</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="mailto:hello@hseqnova.co.uk">Email us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
