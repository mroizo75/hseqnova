import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  Flame,
  GraduationCap,
  HardHat,
  RefreshCw,
  Shield,
  Siren,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { HSEQ_CORE, UK_VAT_PERCENT } from "@/lib/billing-catalog";
import { formatGbp } from "@/lib/homepage-content";
import {
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

const PAGE_TITLE = "Living Health and Safety Policy Software | HSEQ Nova";
const PAGE_DESCRIPTION =
  "A living health and safety policy for HSWA s.2(3): statement of intent, organisation and arrangements that link to live modules. Not a static PDF. Part of HSEQ Nova Core at £29/month.";
const PAGE_PATH = "/health-and-safety-policy";
const PAGE_KEYWORDS =
  "health and safety policy, HSWA s.2(3), written safety policy, health and safety policy software, living policy, statement of intent, organisation and arrangements, H&S policy UK";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: PAGE_KEYWORDS,
  alternates: { canonical: getCanonicalUrl(PAGE_PATH) },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const THREE_PARTS = [
  {
    icon: FileText,
    number: "01",
    title: "Statement of intent",
    text: "The director signs a commitment to health and safety. HSEQ Nova keeps the statement versioned so you can show auditors and assessors the current, signed copy at any time.",
  },
  {
    icon: Users,
    number: "02",
    title: "Organisation",
    text: "Who is responsible for what. The organisation section maps directors, managers, supervisors, safety representatives and the competent person. When someone changes role, the policy updates with them.",
  },
  {
    icon: ClipboardCheck,
    number: "03",
    title: "Arrangements",
    text: "The practical procedures your company follows — risk assessment, inspections, fire drills, training, accident reporting. In HSEQ Nova, each arrangement links to the live module that does the work.",
  },
] as const;

const LIVING_BENEFITS = [
  {
    icon: RefreshCw,
    title: "Arrangements point at live work",
    text: "When the arrangements say 'we carry out workplace inspections', that line links to the inspection module where supervisors actually record the last walkround. Auditors follow the link, not a page reference to a binder.",
  },
  {
    icon: Shield,
    title: "Organisation chart stays current",
    text: "Add a new first aider or change the competent person and the organisation section reflects it immediately. No rewriting a Word document and re-circulating a PDF.",
  },
  {
    icon: Siren,
    title: "Accident book is part of the system",
    text: "The arrangement for accident reporting links to the digital accident book. Injuries and near misses are logged in the same system the policy sits in, with RIDDOR triage built in.",
  },
  {
    icon: GraduationCap,
    title: "Training records tie in",
    text: "The arrangement for competence links to training records. When an employee completes a course, the evidence is already where the policy says it should be.",
  },
  {
    icon: Flame,
    title: "Fire drills are recorded, not assumed",
    text: "The arrangement for fire safety links to fire drill records. The date, participants and any issues are logged — so the responsible person can prove drills happen at the expected frequency.",
  },
  {
    icon: BookOpen,
    title: "Version history for every change",
    text: "Every edit to the statement, organisation or arrangements is saved with a timestamp and the person who made the change. If HSE or an assessor asks for the version that was live on a particular date, you can show it.",
  },
] as const;

const STATIC_VS_LIVING = [
  {
    static: "PDF emailed once a year",
    living: "Always the current version, accessible from any device",
  },
  {
    static: "Organisation chart from three hires ago",
    living: "Organisation updates when roles change",
  },
  {
    static: "Arrangements describe what should happen",
    living: "Arrangements link to the modules where work is recorded",
  },
  {
    static: "No proof anyone has read it",
    living: "Read-and-sign tracking for the statement of intent",
  },
  {
    static: "Version history is 'policy-v3-final-FINAL.docx'",
    living: "Automatic version history with date, editor and diff",
  },
] as const;

const FAQS = [
  {
    question: "Do I legally need a written health and safety policy?",
    answer:
      "Under HSWA s.2(3), employers with five or more employees must prepare and keep revised a written statement of their general policy on health and safety, together with the organisation and arrangements for carrying out that policy. Smaller employers are not legally required to write it down, but it is still good practice.",
  },
  {
    question: "What are the three parts of a health and safety policy?",
    answer:
      "HSE guidance splits the written policy into three parts: a statement of intent (signed commitment from a senior person), organisation (who is responsible for what) and arrangements (the practical procedures the company follows). HSEQ Nova structures the policy this way.",
  },
  {
    question: "What makes this a 'living' policy?",
    answer:
      "In HSEQ Nova, the arrangements section links to the live modules — risk assessments, inspections, fire drills, training records and the accident book. When a supervisor completes an inspection, the proof sits where the policy says it should. The policy is the table of contents for work that is actually happening.",
  },
  {
    question: "Can I export the policy as a PDF?",
    answer:
      "Yes. You can generate a PDF of the current statement, organisation and arrangements at any time — for a tender, an assessor or a client who wants a copy. The PDF is a snapshot; the live version in the system is the authoritative one.",
  },
  {
    question: "Does HSEQ Nova write the policy content for me?",
    answer:
      "HSEQ Nova provides the structure and links the arrangements to live modules. You write the statement of intent and define the organisation. The arrangements are partly built from the modules you switch on — if you use the inspection module, the arrangement for inspections is already drafted.",
  },
  {
    question: "How does this help with CHAS or Constructionline?",
    answer:
      "SSIP assessors check that you have a current, signed policy with statement, organisation and arrangements. A living policy in HSEQ Nova gives them a URL or a dated PDF. Arrangements link to the actual evidence — inspections, training, risk assessments — rather than just describing them.",
  },
  {
    question: "Is the health and safety policy part of Core?",
    answer: `Yes. The living policy is included in HSEQ Nova Core at ${formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month excluding VAT, with unlimited users. No extra charge for the policy module.`,
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
      name: "HSEQ Nova — Living Health and Safety Policy",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PAGE_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: String(HSEQ_CORE.monthlyPriceGbp),
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(HSEQ_CORE.monthlyPriceGbp),
          priceCurrency: "GBP",
          valueAddedTaxIncluded: false,
          billingDuration: "P1M",
          unitText: "MONTH",
        },
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

export default function HealthAndSafetyPolicyPage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={getJsonLd()} />
      <Hero />
      <ThreePartsSection />
      <LivingBenefits />
      <StaticVsLiving />
      <PricingStrip />
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
            HSWA s.2(3) · written policy
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            A health and safety policy that lives with the work
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Statement of intent, organisation and arrangements — structured the way HSE
            guidance asks for it. Arrangements link to the modules where work is actually
            recorded, so the policy is never a stale PDF in a drawer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              <Link href="/register">
                Start your living policy
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
            Part of Core · {formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month ex VAT · unlimited users
          </p>
        </div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-policy.jpg"
              alt="Director reviewing a living health and safety policy on a laptop"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">Living H&S policy</p>
              <p className="text-xs text-white/75">
                Statement, organisation and arrangements — linked to live modules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThreePartsSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          The legal structure
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          Three parts, as HSE guidance describes them
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          The Health and Safety at Work etc. Act 1974, section 2(3), requires employers
          with five or more employees to prepare a written policy. HSE guidance
          breaks it into statement, organisation and arrangements. HSEQ Nova follows that
          same structure.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-4xl divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
        {THREE_PARTS.map((part) => (
          <div key={part.title} className="grid gap-4 py-8 sm:grid-cols-[3rem_1fr]">
            <span className="font-display text-2xl text-emerald-800 tabular-nums">
              {part.number}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <part.icon className="h-5 w-5 text-emerald-700" aria-hidden />
                <h3 className="text-lg font-semibold tracking-tight">{part.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
                {part.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LivingBenefits() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Why "living"
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Arrangements link to the work, not to a page number
          </h2>
          <p className="mt-4 text-white/75">
            In a static policy, the arrangements say what should happen. In a living
            policy, they link to where it is happening.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {LIVING_BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-sm border border-white/10 bg-white/5 p-6"
            >
              <benefit.icon className="h-6 w-6 text-emerald-300" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{benefit.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StaticVsLiving() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Before and after
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          Static PDF vs. living policy
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          Most companies already have a written policy somewhere. The question is whether
          it reflects what the company is doing today.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-sm border border-[hsl(var(--home-rule))]">
        <div className="grid grid-cols-2 bg-[hsl(var(--home-ticket))] text-xs font-semibold uppercase tracking-[0.14em]">
          <div className="px-5 py-3">Static PDF</div>
          <div className="border-l border-[hsl(var(--home-rule))] px-5 py-3 text-emerald-800">
            Living policy in HSEQ Nova
          </div>
        </div>
        {STATIC_VS_LIVING.map((row) => (
          <div
            key={row.static}
            className="grid grid-cols-2 border-t border-[hsl(var(--home-rule))]"
          >
            <div className="px-5 py-4 text-sm text-[hsl(var(--home-ink)/0.6)]">
              {row.static}
            </div>
            <div className="flex items-start gap-2 border-l border-[hsl(var(--home-rule))] px-5 py-4 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
              <span>{row.living}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingStrip() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto px-4 py-16 text-center lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Included in Core
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          {formatGbp(HSEQ_CORE.monthlyPriceGbp)} per month, unlimited users
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[hsl(var(--home-ink)/0.72)]">
          The living health and safety policy is part of HSEQ Nova Core. No add-on
          required. The same subscription includes the accident book, risk assessments,
          inspections, training records and fire drills.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            className="h-12 border-[hsl(var(--home-rule))] bg-transparent text-[hsl(var(--home-ink))] hover:bg-white"
          >
            <Link href="/pricing">Full pricing breakdown</Link>
          </Button>
        </div>
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
          Answers about the written policy duty under HSWA s.2(3), what a living policy
          means and how HSEQ Nova structures it.
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
              <BookOpen className="h-4 w-4" aria-hidden />
              HSWA s.2(3) — statement, organisation, arrangements
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Stop re-writing the policy and start linking it to the work
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              The living policy is part of Core at{" "}
              {formatGbp(HSEQ_CORE.monthlyPriceGbp)} a month. Unlimited users can read,
              sign and follow the arrangements to the modules where the work is done.
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
