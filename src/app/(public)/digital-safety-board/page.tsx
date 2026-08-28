import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HardHat,
  Laptop,
  Monitor,
  QrCode,
  Shield,
  Smartphone,
  Users,
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

const PAGE_TITLE = "Digital Site Safety Board for UK Construction | HSEQ Nova";
const PAGE_DESCRIPTION =
  "A digital safety board for UK construction sites. Shows F10, CPP, first aider, fire marshal, RAMS and accident tally at the gate — with no personal data on public screens. GDPR compliant. From £30/month.";
const PAGE_PATH = "/digital-safety-board";
const PAGE_KEYWORDS =
  "digital safety board, site safety board, construction site board, CDM 2015 site information, digital site induction, site gate board, F10 notice board, QR site access";

const safetyBoardPack = ADDON_PACKS.find((p) => p.id === "safety-board")!;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: PAGE_KEYWORDS,
  alternates: { canonical: getCanonicalUrl(PAGE_PATH) },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const BOARD_SHOWS = [
  "F10 notification to HSE",
  "Construction phase plan summary",
  "Health and safety file reference",
  "Named first aider and fire marshal",
  "Daily site register (headcount, not names)",
  "Current RAMS for active work",
  "Accident and near-miss tally",
  "Emergency procedures and assembly point",
  "Principal contractor and client details",
  "Site rules and PPE requirements",
] as const;

const THREE_MODES = [
  {
    icon: Monitor,
    title: "Standalone board",
    text: "Set up a safety board for any site without subscribing to the full HSEQ system. Enter site details, upload documents and display the board on a screen at the gate.",
  },
  {
    icon: Shield,
    title: "HSEQ add-on",
    text: "Connect the board to your live HSEQ data. First aiders, fire marshals, RAMS and the accident tally pull from the same system your competent person already uses — no double entry.",
  },
  {
    icon: Laptop,
    title: "Hybrid per project",
    text: "Some projects run standalone boards; others pull live data. Mix and match across your sites from one account. Each project gets its own board URL and QR code.",
  },
] as const;

const GDPR_POINTS = [
  {
    icon: EyeOff,
    title: "No names on the public screen",
    text: "The board shows roles — 'First aider on site today' — not personal names. Anyone walking past the gate sees duties, not a staff list.",
  },
  {
    icon: Eye,
    title: "Details behind QR login",
    text: "Workers who scan the QR code and log in see the full detail they need: the named first aider, the fire marshal, their induction record. Public and private views are separated.",
  },
  {
    icon: Users,
    title: "Visitor induction without paper",
    text: "Visitors scan the QR code, read the site rules and confirm they understand. The record is stored digitally — no clipboard at the gate that anyone can read.",
  },
] as const;

const FAQS = [
  {
    question: "What does the digital safety board show?",
    answer:
      "The board displays the information CDM 2015 expects at the site entrance: F10 notification, construction phase plan summary, current RAMS, named roles (first aider, fire marshal), accident and near-miss tally, emergency procedures and site rules. Personal names are kept off the public screen.",
  },
  {
    question: "Do I need the full HSEQ Nova system to use the safety board?",
    answer:
      "No. You can run a standalone board without HSEQ Nova Core. If you do subscribe to Core, switching on the safety board add-on pulls live data — first aiders, RAMS and accident tallies update automatically.",
  },
  {
    question: "How does the board handle personal data and GDPR?",
    answer:
      "The public display shows roles, not names. Workers and visitors who scan the QR code and authenticate see the detail relevant to them. Visitor induction records are stored digitally, not on a clipboard anyone can read. This keeps you aligned with UK GDPR and CDM 2015.",
  },
  {
    question: "Can visitors use the QR code for site induction?",
    answer:
      "Yes. Visitors scan the code at the gate, read the site rules and confirm they understand before entering. The induction record is saved with a timestamp, replacing the paper sign-in sheet.",
  },
  {
    question: "What hardware do I need for the kiosk display?",
    answer:
      "Any screen with a web browser works — a tablet mounted at the gate, a TV on a stand, or a weatherproof monitor. The board runs in a full-screen browser tab. No special hardware or app install is needed.",
  },
  {
    question: "How much does the digital safety board cost?",
    answer: `The safety board add-on is ${formatGbp(safetyBoardPack.monthlyPriceGbp)} per month excluding VAT. If you use it as a standalone board (without HSEQ Nova Core), the same price applies. There is no per-site charge — one subscription covers all your projects.`,
  },
  {
    question: "Does the board help with SSIP or CHAS applications?",
    answer:
      "Assessors reviewing site arrangements under CHAS, Constructionline or SafeContractor look for evidence that site information is communicated. A digital board with a URL you can share is easier to evidence than a photograph of a whiteboard.",
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
      name: "HSEQ Nova Digital Safety Board",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: PAGE_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: String(safetyBoardPack.monthlyPriceGbp),
        priceCurrency: "GBP",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(safetyBoardPack.monthlyPriceGbp),
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

export default function DigitalSafetyBoardPage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={getJsonLd()} />
      <Hero />
      <WhatTheBoard />
      <ThreeModes />
      <GdprSection />
      <KioskAndQr />
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
            CDM 2015 · site information
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            A digital safety board at the site gate
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Show the F10, CPP summary, first aider, fire marshal, current RAMS and the
            accident tally on a screen anyone can read — without putting personal data
            on a public display.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              <Link href="/register">
                Start with the safety board
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
            {formatGbp(safetyBoardPack.monthlyPriceGbp)}/month ex VAT · no per-site charge
          </p>
        </div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-safety-board.jpg"
              alt="Digital safety board displayed on a screen at a UK construction site entrance"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">Site gate board</p>
              <p className="text-xs text-white/75">
                F10, first aider, RAMS and the accident tally — roles only, no names on screen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatTheBoard() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          What the board displays
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          Everything CDM 2015 expects at a site entrance
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          CDM 2015 requires the principal contractor to display site rules and ensure
          workers and visitors know the emergency procedures. A digital board keeps that
          information current — not a whiteboard photo from the first week on site.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-3xl">
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {BOARD_SHOWS.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ThreeModes() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Three ways to run it
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Standalone, connected or hybrid — your choice
          </h2>
          <p className="mt-4 text-white/75">
            Not every site needs the full HSEQ system behind the board. Pick the mode
            that fits each project.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
          {THREE_MODES.map((mode) => (
            <article
              key={mode.title}
              className="rounded-sm border border-white/10 bg-white/5 p-6"
            >
              <mode.icon className="h-6 w-6 text-emerald-300" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold">{mode.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{mode.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GdprSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          GDPR and privacy
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          Personal data stays off the public screen
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          A whiteboard at the gate with names, phone numbers and induction details is a
          data protection risk. The digital safety board separates the public view from
          the authenticated view, so the information workers need is still available — just
          not to every passer-by.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-3">
        {GDPR_POINTS.map((point) => (
          <article key={point.title} className="border-t border-[hsl(var(--home-rule))] pt-5">
            <point.icon className="h-5 w-5 text-emerald-700" aria-hidden />
            <h3 className="mt-3 font-semibold">{point.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {point.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function KioskAndQr() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Kiosk display
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Full-screen mode for any screen
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
            Mount a tablet or TV at the site entrance and open the board URL in a
            full-screen browser tab. The display rotates through panels — site rules,
            emergency contacts, current RAMS, the accident tally — so the screen never
            goes stale.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Works on any device with a web browser",
              "No app install or special hardware required",
              "Auto-refreshes when data changes",
              "Rotates panels to keep all information visible",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            QR code access
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Scan, read, enter
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
            Every project gets a unique QR code. Workers scan it to see the full safety
            information — named first aider, fire marshal, the CPP and any RAMS relevant
            to their task. Visitors scan the same code for site induction.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Unique QR per project — no mix-ups between sites",
              "Workers see full detail after authentication",
              "Visitor induction replaces the paper sign-in sheet",
              "Print the QR on hoarding, PPE boards or welcome packs",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PricingStrip() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Pricing
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          One price, all your sites
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          The digital safety board is{" "}
          <strong>{formatGbp(safetyBoardPack.monthlyPriceGbp)} per month</strong>{" "}
          excluding {UK_VAT_PERCENT}% VAT. No per-site or per-screen surcharge. Use it
          standalone or as an add-on to HSEQ Nova Core at{" "}
          {formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
          >
            <Link href="/register">
              Start with the safety board
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-[hsl(var(--home-rule))] bg-transparent text-[hsl(var(--home-ink))] hover:bg-[hsl(var(--home-ticket))]"
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
          Common questions about the digital safety board, site information duties and
          how the board handles personal data.
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
              CDM 2015 site information — digitised
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Replace the whiteboard at the gate with a board that stays current
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              F10, first aider, RAMS and the accident tally on a screen — not a
              laminated sheet from week one. Personal data behind a QR login, not on
              a public display.
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
