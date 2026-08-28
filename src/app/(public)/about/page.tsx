import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Scale,
  Wrench,
  CreditCard,
  Shield,
  BookOpen,
  Siren,
  ClipboardCheck,
  Flame,
  GraduationCap,
  HardHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCanonicalUrl,
  ROBOTS_CONFIG,
  getOpenGraphDefaults,
  getTwitterDefaults,
  SITE_CONFIG,
} from "@/lib/seo-config";

const pageTitle = "About HSEQ Nova | Health and Safety Software for the UK";
const pageDescription =
  "HSEQ Nova is a new, purpose-built HSEQ platform for UK employers. Built around HSWA, MHSWR, RIDDOR, COSHH and CDM 2015 from the start — not translated from another market.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: getCanonicalUrl("/about") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(pageTitle, pageDescription, "/about"),
  twitter: getTwitterDefaults(pageTitle, pageDescription),
};

const DUTIES = [
  "HSWA 1974",
  "MHSWR 1999",
  "RIDDOR 2013",
  "COSHH 2002",
  "CDM 2015",
  "Fire Safety Order 2005",
] as const;

const VALUES = [
  {
    icon: Scale,
    title: "Duty-first",
    text: "Every module starts with what the law actually requires. We read the regulation, define the mandatory fields, then build. No feature exists without a legal or practical basis.",
  },
  {
    icon: Wrench,
    title: "Practical",
    text: "If a feature does not help the person on site — the first aider recording an injury, the supervisor running an inspection — we do not build it. The system serves the people who do the work.",
  },
  {
    icon: CreditCard,
    title: "Transparent pricing",
    text: "One company price, unlimited users. No per-seat fees that punish you for giving access to the people who need it. No hidden costs for features you assumed were included.",
  },
] as const;

const CORE_MODULES = [
  { icon: BookOpen, label: "Living H&S policy", duty: "HSWA s.2(3)" },
  { icon: Siren, label: "Accident book + RIDDOR", duty: "RIDDOR 2013" },
  { icon: Shield, label: "Risk assessments", duty: "MHSWR 1999" },
  { icon: ClipboardCheck, label: "Workplace inspections", duty: "MHSWR 1999" },
  { icon: Flame, label: "Fire drills", duty: "Fire Safety Order 2005" },
  { icon: GraduationCap, label: "Training records", duty: "HSWA s.2(2)(c)" },
] as const;

const DIFFERENTIATORS = [
  {
    title: "Purpose-built for UK legislation",
    text: "HSWA, MHSWR, RIDDOR, COSHH, CDM 2015, Fire Safety Order — the system is designed around these duties from the database up. Not adapted, not translated, not bolted on.",
  },
  {
    title: "Not a translated product",
    text: "HSEQ Nova was written for the UK market. Field labels, reporting deadlines, terminology and workflows reflect how UK employers actually manage health and safety.",
  },
  {
    title: "Priced per company, not per seat",
    text: "Directors, competent persons, supervisors and first aiders all need access. A seat-based model forces someone onto paper. We charge one price per company — everyone logs in.",
  },
  {
    title: "Add-ons only when the work asks",
    text: "Core HSEQ covers daily duties. RAMS, COSHH, CDM, the digital safety board and other industry packs switch on when a contract or a substance requires them — not before.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="home-marketing font-marketing">
      <HeroSection />
      <DutyStrip />
      <MissionSection />
      <BeliefsSection />
      <DifferentSection />
      <ProductSection />
      <ValuesSection />
      <CtaSection />
    </div>
  );
}

function HeroSection() {
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
            About HSEQ Nova
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            Built for UK law, from day one
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            HSEQ Nova is a new health and safety platform, purpose-built for UK employers.
            Every module starts with the duty — then we build the simplest tool that helps
            you meet it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              <Link href="/register">
                Start using HSEQ Nova
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
          <Image
            src="/images/hero-about.jpg"
            alt="UK workplace with health and safety documentation on screen"
            width={1280}
            height={720}
            className="aspect-[16/10] w-full object-cover"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
            <p className="text-sm font-medium">A system that starts with the duty</p>
            <p className="text-xs text-white/75">
              Not a spreadsheet collection — a living HSEQ platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DutyStrip() {
  return (
    <div className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-[hsl(var(--home-ink)/0.7)]">
        {DUTIES.map((duty) => (
          <span key={duty} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" aria-hidden />
            {duty}
          </span>
        ))}
      </div>
    </div>
  );
}

function MissionSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Our mission
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Make health and safety compliance straightforward for every UK employer
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          The law is clear about what employers must do. The difficulty is not knowing the
          duties — it is keeping the records, the assessments and the weekly rhythm in a
          form that people will actually use. HSEQ Nova exists to close that gap.
        </p>
      </div>
    </section>
  );
}

function BeliefsSection() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            What we believe
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
            Safety should be practical, not bureaucratic
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/75">
            The system should serve the people who do the work — the first aider on site,
            the supervisor running the inspection, the director who needs to see the full
            picture. If a tool only makes life easier for the person buying the software,
            it has missed the point.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="rounded-sm border border-white/10 bg-white/5 p-8">
            <h3 className="font-display text-xl font-medium">
              The duty comes first
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              We do not start with features and look for a regulation to justify them. We
              read the Act, the Regulations and HSE guidance — then build the minimum tool
              that helps you comply.
            </p>
          </div>
          <div className="rounded-sm border border-white/10 bg-white/5 p-8">
            <h3 className="font-display text-xl font-medium">
              Access should not be rationed
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Per-seat pricing forces companies to decide who gets a login. That means
              someone ends up on paper. HSEQ Nova is priced per company — everyone who
              needs to log an injury or run an inspection can do so.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DifferentSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          How we are different
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Designed for the way UK health and safety actually works
        </h2>
      </div>

      <ol className="mx-auto mt-14 max-w-3xl divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
        {DIFFERENTIATORS.map((item, index) => (
          <li key={item.title} className="grid gap-4 py-8 sm:grid-cols-[3rem_1fr]">
            <span className="font-display text-2xl text-emerald-800 tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProductSection() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto px-4 py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            The product
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
            Core HSEQ for daily duties. Industry add-ons when the work asks for them.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
            Every company gets the core modules — the duties that apply to almost every UK
            employer. Construction, hazardous substances and other specialist packs are
            available as add-ons, so you only pay for what the work requires.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_MODULES.map((mod) => (
            <Card
              key={mod.label}
              className="border-[hsl(var(--home-rule))] bg-white/60"
            >
              <CardContent className="flex items-start gap-4 p-6">
                <mod.icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
                <div>
                  <p className="font-semibold tracking-tight">{mod.label}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--home-ink)/0.6)]">
                    {mod.duty}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <HardHat className="h-5 w-5 text-emerald-800" />
          <p className="text-sm text-[hsl(var(--home-ink)/0.7)]">
            <span className="font-semibold text-[hsl(var(--home-ink))]">Add-ons:</span>{" "}
            RAMS, COSHH, CDM, digital safety board and more — switch on when a contract
            or substance requires them.
          </p>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Our values
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Three principles behind every decision
        </h2>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title} className="text-center md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 md:mx-0">
              <value.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-xl font-medium tracking-tight">
              {value.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {value.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/75">
          HSEQ Nova is live and ready for UK employers. Start with Core — add industry
          packs when the work needs them.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
          >
            <Link href="/register">
              Start using HSEQ Nova
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/contact">Get in touch</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-white/50">
          Questions? Email{" "}
          <a
            href={`mailto:${SITE_CONFIG.contactEmail}`}
            className="underline underline-offset-2 hover:text-white/80"
          >
            {SITE_CONFIG.contactEmail}
          </a>
        </p>
      </div>
    </section>
  );
}
