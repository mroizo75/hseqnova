import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  Flame,
  GraduationCap,
  HardHat,
  Shield,
  Siren,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADDON_PACKS, HSEQ_CORE, UK_VAT_PERCENT } from "@/lib/billing-catalog";
import { formatGbp, HOME_FAQS } from "@/lib/homepage-content";

const DUTIES = [
  "HSWA 1974",
  "MHSWR 1999",
  "RIDDOR 2013",
  "COSHH 2002",
  "CDM 2015",
  "Fire Safety Order 2005",
] as const;

const PROBLEMS = [
  {
    title: "The policy is a PDF from the last tender",
    text: "HSWA s.2(3) asks for statement, organisation and arrangements. A handbook that never meets the live work does not help the people who have to follow it.",
  },
  {
    title: "The accident book lives in the canteen",
    text: "Paper pads go missing. Near misses never get written up. When someone is off for eight days, RIDDOR becomes a scramble instead of a clock you already started.",
  },
  {
    title: "Inspections sit in a camera roll",
    text: "Supervisors take photos. Actions live in a WhatsApp thread. By the time a director asks what is overdue, the trail is gone.",
  },
  {
    title: "Evidence for a scheme takes an afternoon to hunt",
    text: "CHAS, Constructionline and other SSIP questionnaires want proof you already do the work. If it is not in one place, you rebuild the file every time.",
  },
] as const;

const BENEFITS = [
  {
    icon: Siren,
    title: "Log it while it is fresh",
    text: "First aiders record injuries and near misses in minutes. If it is reportable, you see the RIDDOR deadline — without delay, 10 days, or 15 days.",
    href: "/riddor",
    link: "Digital accident book and RIDDOR",
  },
  {
    icon: BookOpen,
    title: "A policy that matches the work",
    text: "Statement of intent, organisation and arrangements stay linked to the modules you actually use. The policy is the table of contents, not a stale copy of every procedure.",
    href: "/health-and-safety-policy",
    link: "Living health and safety policy",
  },
  {
    icon: Users,
    title: "Everyone who needs it can use it",
    text: "The price is per company. Supervisors, first aiders and directors log in without a seat count deciding who is left on paper.",
    href: "/pricing",
    link: "How company pricing works",
  },
  {
    icon: ClipboardCheck,
    title: "The weekly rhythm stays visible",
    text: "Workplace inspections, training, fire drills and actions sit next to the policy. Directors see what is overdue. Site teams see what to do today.",
    href: "/#features",
    link: "What Core includes",
  },
] as const;

const CORE_ITEMS = [
  { icon: BookOpen, label: "Living H&S policy", hook: "HSWA s.2(3)" },
  { icon: Siren, label: "Accident book + RIDDOR", hook: "RIDDOR 2013" },
  { icon: Shield, label: "Risk assessments", hook: "MHSWR 1999" },
  { icon: ClipboardCheck, label: "Workplace inspections", hook: "MHSWR 1999" },
  { icon: Flame, label: "Fire drills", hook: "Fire Safety Order 2005" },
  { icon: GraduationCap, label: "Training records", hook: "HSWA s.2(2)(c)" },
] as const;

const FEATURES = [
  {
    href: "/riddor",
    title: "Accident book and RIDDOR",
    text: "Record injuries and near misses on a phone. Reportable events get the right HSE clock without a separate spreadsheet.",
    image: "/images/hero-accident-book.jpg",
    alt: "Tablet showing a digital accident book beside high-visibility kit",
    hook: "Accident book; RIDDOR 2013",
  },
  {
    href: "/health-and-safety-policy",
    title: "Living health and safety policy",
    text: "Written for five or more employees: statement, organisation and arrangements that point at live work, not last year's PDF.",
    image: "/images/hero-policy.jpg",
    alt: "Director reviewing a living health and safety policy on a laptop",
    hook: "HSWA s.2(3)",
  },
  {
    href: "/digital-safety-board",
    title: "Digital safety board",
    text: "Induction, F10, CPP and first aiders on a public board at the gate. Personal data stays off the screen.",
    image: "/images/hero-site-board.jpg",
    alt: "Construction workers at a site entrance with a digital safety board",
    hook: "CDM 2015 site information",
    addon: true,
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Register the company",
    text: "Subscribe to Core. Unlimited people can be invited from day one.",
  },
  {
    n: "02",
    title: "Put the duty live",
    text: "Publish the policy. Open the accident book. Run the next inspection from the same place.",
  },
  {
    n: "03",
    title: "Add a pack when the work asks",
    text: "RAMS, COSHH, CDM or the site board switch on when a contract or a hazardous substance requires them.",
  },
] as const;

const AUDIENCE = [
  {
    title: "Directors",
    text: "See the written policy, overdue actions and a single picture of what the company is actually doing.",
  },
  {
    title: "Competent persons",
    text: "Keep assessments, inspections and records together so the weekly HSEQ job is the work, not the filing.",
  },
  {
    title: "Supervisors",
    text: "Log inspections and follow-up on site, without waiting for an office login.",
  },
  {
    title: "First aiders",
    text: "Write up an injury or a near miss in the time it used to take to find the pad.",
  },
] as const;

const ADDON_HREFS: Record<string, string> = {
  rams: "/rams",
  coshh: "/coshh",
  cdm: "/pricing",
  "safety-board": "/digital-safety-board",
  audits: "/pricing",
  environment: "/pricing",
};

export function HomePage() {
  return (
    <div className="home-marketing font-marketing">
      <Hero />
      <DutyStrip />
      <ProblemSection />
      <BenefitsSection />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <AudienceSection />
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
            HSEQ software for UK employers
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            Run health and safety as the work happens
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            One system for the accident book, RIDDOR, your written policy, inspections and
            fire drills. Built around UK duties — so the weekly HSEQ job is easier to finish,
            not harder to file.
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
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/60">
            UK VAT invoices. Pay by Bacs Direct Debit, card or invoice.
          </p>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-site-board.jpg"
              alt="UK construction site with a digital safety board at the gate"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">Digital safety board on the gate</p>
              <p className="text-xs text-white/75">
                Induction, first aiders and F10 — without names on a public screen.
              </p>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-2 right-6 rounded-sm border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] p-5 text-[hsl(var(--home-ink))] shadow-lg sm:right-auto sm:w-72">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
              Core · unlimited users
            </p>
            <p className="mt-1 font-display text-4xl font-medium tabular-nums">
              {formatGbp(HSEQ_CORE.monthlyPriceGbp)}
              <span className="ml-1 text-base font-sans font-normal text-[hsl(var(--home-ink)/0.65)]">
                /month ex VAT
              </span>
            </p>
            <p className="mt-2 text-sm leading-snug text-[hsl(var(--home-ink)/0.7)]">
              One company price. Add RAMS, COSHH or CDM only when the work needs them.
            </p>
          </div>
        </div>
      </div>
          <div className="h-28 sm:h-20" />
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

function ProblemSection() {
  return (
    <section className="container mx-auto grid gap-12 px-4 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          The job to be done
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Health and safety work fails when it lives in folders
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          Most companies already know the duties. The hard part is keeping the accident
          book, the policy and the weekly inspections in a form people will actually use.
        </p>
      </div>
      <ol className="divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
        {PROBLEMS.map((problem, index) => (
          <li key={problem.title} className="grid gap-4 py-8 sm:grid-cols-[3rem_1fr]">
            <span className="font-display text-2xl text-emerald-800 tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{problem.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
                {problem.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            What changes
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
            What HSEQ Nova does for UK employers
          </h2>
          <p className="mt-4 text-white/70">
            The software takes the filing off the critical path so the legal work can happen
            on site, on the day.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="border border-white/10 bg-white/[0.04] p-7"
            >
              <benefit.icon className="h-5 w-5 text-emerald-300" aria-hidden />
              <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">
                {benefit.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{benefit.text}</p>
              <Link
                href={benefit.href}
                className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-200 hover:text-white"
              >
                {benefit.link}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-24">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Three steps
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
          How HSEQ Nova works
        </h2>
      </div>
      <div className="grid gap-10 md:grid-cols-3">
        {STEPS.map((step) => (
          <article key={step.n} className="border-t border-[hsl(var(--home-rule))] pt-6">
            <p className="font-display text-sm tracking-[0.2em] text-emerald-800">{step.n}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {step.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-[hsl(var(--home-rule))]">
      <div className="container mx-auto px-4 py-20 lg:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
            Core HSEQ features
          </h2>
          <p className="mt-3 text-[hsl(var(--home-ink)/0.7)]">
            Core is on from day one. Industry packs sit on top — you do not pay for a
            construction module if you run a warehouse.
          </p>
        </div>
        <ul className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CORE_ITEMS.map((item) => (
            <li
              key={item.label}
              className="border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] px-3 py-4 text-center"
            >
              <item.icon className="mx-auto h-4 w-4 text-emerald-800" aria-hidden />
              <p className="mt-2 text-sm font-semibold leading-snug">{item.label}</p>
              <p className="mt-1 text-[11px] text-[hsl(var(--home-ink)/0.55)]">{item.hook}</p>
            </li>
          ))}
        </ul>
        <div className="grid gap-6 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group overflow-hidden border border-[hsl(var(--home-rule))] bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
                {"addon" in feature && feature.addon ? (
                  <span className="absolute left-3 top-3 bg-[hsl(var(--home-ink))] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Add-on
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  {feature.hook}
                </p>
                <h3 className="mt-2 text-lg font-semibold group-hover:text-emerald-800">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
                  {feature.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] py-20 lg:py-24"
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="border border-[hsl(var(--home-ink)/0.12)] bg-white p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
              HSEQ Nova Core
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
              HSEQ Nova pricing
            </h2>
            <p className="mt-4 font-display text-5xl font-medium tabular-nums">
              {formatGbp(HSEQ_CORE.monthlyPriceGbp)}
              <span className="ml-2 text-lg font-sans font-normal text-[hsl(var(--home-ink)/0.6)]">
                /month ex VAT
              </span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              One price for the whole company. Unlimited users. Core covers the duties most
              UK employers run every week.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Living health and safety policy",
                "Digital accident book and RIDDOR triage",
                "Risk assessments, documents and actions",
                "Workplace inspections, training and fire drills",
                "Organisation chart",
                `UK VAT invoice at ${UK_VAT_PERCENT}%`,
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 h-12">
              <Link href="/register">
                Start HSEQ Nova
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div>
            <h3 className="font-display text-2xl font-medium tracking-tight">
              Add the packs your sites need
            </h3>
            <p className="mt-2 text-sm text-[hsl(var(--home-ink)/0.7)]">
              Keep Core lean. Switch a pack on when a contract, a substance or a site asks
              for it.
            </p>
            <ul className="mt-6 divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
              {ADDON_PACKS.map((pack) => (
                <li key={pack.id}>
                  <Link
                    href={ADDON_HREFS[pack.id] ?? "/pricing"}
                    className="flex items-baseline justify-between gap-4 py-4 hover:text-emerald-800"
                  >
                    <span>
                      <span className="block font-medium">{pack.name}</span>
                      <span className="mt-1 block text-sm text-[hsl(var(--home-ink)/0.65)]">
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
            <p className="mt-4 text-sm text-[hsl(var(--home-ink)/0.6)]">
              Need invoice billing? Email{" "}
              <a className="underline underline-offset-2" href="mailto:hello@hseqnova.co.uk">
                hello@hseqnova.co.uk
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-24">
      <div className="mb-12 max-w-2xl">
        <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
          Who HSEQ Nova is for
        </h2>
        <p className="mt-3 text-[hsl(var(--home-ink)/0.7)]">
          Built for the people who have to produce the record, not only the person who buys
          the software.
        </p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCE.map((item) => (
          <article key={item.title} className="border-t border-[hsl(var(--home-rule))] pt-5">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
              {item.text}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-[hsl(var(--home-ink)/0.65)]">
        HSEQ Nova is the system. It does not replace your competent person, and it is not
        consultancy.{" "}
        <Link href="/health-safety-software" className="underline underline-offset-2">
          How the software maps to UK duties
        </Link>
        .
      </p>
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
          Direct answers for employers, competent persons and anyone comparing health and
          safety software for the UK.
        </p>
        <div className="mt-10 divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
          {HOME_FAQS.map((faq) => (
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
              Built for UK law, not a generic checklist
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Put the accident book, the policy and the site board in one place
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              Start with Core at {formatGbp(HSEQ_CORE.monthlyPriceGbp)} a month. Add RAMS,
              COSHH or the digital safety board when a contract or a site asks for them.
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
                <Link href="/digital-safety-board">See the safety board</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
