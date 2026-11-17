import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ClipboardList,
  GraduationCap,
  HardHat,
} from "lucide-react";
import { TRAINING_COURSES as COURSES } from "@/features/training-sales/lib/catalogue";
import { Button } from "@/components/ui/button";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import {
  getBreadcrumbSchema,
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

const PAGE_TITLE = "Workplace Training — Work at Height, MEWPs and Work Equipment | HSEQ Nova";
const PAGE_DESCRIPTION =
  "Competence training for work at height, mobile elevating work platforms, pallet trucks and prefabricated scaffold. No card scheme and no licensed training approval — delivered in English and recorded in HSEQ Nova.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords:
    "work at height training, fall protection training UK, MEWP training without IPAF, pallet truck training, scaffold training up to 9 metres, PUWER training, work equipment competence",
  alternates: { canonical: getCanonicalUrl("/training") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, "/training"),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

const NOT_OFFERED = [
  "IPAF, PASMA, CISRS, RTITB, ITSSAR or CPCS cards",
  "Crane operator certificates",
  "Scaffold above 9 metres",
  "Licensed asbestos work",
  "ADR driver training or Driver CPC",
] as const;

const STEPS = [
  {
    n: "01",
    title: "Tell us the work",
    text: "Which machines, which heights, and who will be in the room. We match the course to that work rather than a generic card category.",
  },
  {
    n: "02",
    title: "Train in English, on the job",
    text: "Classroom and practical sessions at your workplace, using the equipment people will actually use.",
  },
  {
    n: "03",
    title: "Record who is competent",
    text: "Each person who completes the course is recorded in HSEQ Nova, with a review date, so managers can see who is in date.",
  },
] as const;

const FAQS = [
  {
    question: "Do these courses need an approved training provider?",
    answer:
      "No. UK law does not licence a training body for work at height, MEWPs, pedestrian pallet trucks or prefabricated scaffold. The duty is to give suitable and sufficient training and to make sure people are competent — HSWA 1974 section 2(2)(c), the Management Regulations 1999 regulation 13, and PUWER 1998 regulation 9. HSE does not issue a licence for these courses, and a card scheme is not a legal requirement.",
  },
  {
    question: "Is this an IPAF or PASMA card?",
    answer:
      "No. An IPAF PAL card and a PASMA certificate are voluntary industry schemes. They are one way to show competence. They are not what the Work at Height Regulations or PUWER require. This training is competence training for the equipment and the task. It does not issue an IPAF, PASMA or CISRS card.",
  },
  {
    question: "Is there a forklift licence in this catalogue?",
    answer:
      "No. There is no forklift licence in UK law. The catalogue includes pedestrian pallet trucks only. Counterbalance and reach trucks are a separate decision for the employer, and this page does not offer them.",
  },
  {
    question: "Why is scaffold limited to 9 metres?",
    answer:
      "The courses cover prefabricated system scaffold up to 5 metres, and from 5 to 9 metres. They do not cover scaffold above 9 metres. Above that height the work needs a different level of competence, and we do not offer it.",
  },
  {
    question: "Who remains responsible after the course?",
    answer:
      "The employer does. Training does not transfer the duty. The employer must still decide that the training matches the machine, the site and the person, supervise the work, and keep the record. HSEQ Nova stores that record. It does not replace a competent person under the Management Regulations.",
  },
  {
    question: "Can the record sit in HSEQ Nova?",
    answer:
      "Yes. Completed training is stored against the person, with the course and a review date. Managers see who is coming due. The software is the record. The course is delivered by a trainer.",
  },
] as const;

function getStructuredData(): Array<Record<string, unknown>> {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/training/#webpage`,
      url: `${SITE_CONFIG.url}/training`,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      inLanguage: "en-GB",
      isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "HSEQ Nova workplace training",
      itemListElement: COURSES.map((course, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: course.title,
        description: course.audience,
      })),
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

export default function TrainingPage() {
  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData
        dataArray={[
          ...getStructuredData(),
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Training", url: "/training" },
          ]),
        ]}
      />
      <Hero />
      <LegalStrip />
      <Catalogue />
      <HowItWorks />
      <Boundaries />
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
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Competence training · no card scheme
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            Training for the work people actually do
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            Work at height, mobile elevating work platforms, pallet trucks and
            prefabricated scaffold. Taught in English from a fixed syllabus,
            without an IPAF, PASMA or CISRS card — because UK law asks for
            competence, not a particular certificate.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300">
              <Link href="/training/enquire">
                Book a course
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="#courses">See the courses</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/60">
            Delivered at your workplace. Completion is recorded in HSEQ Nova.
          </p>
        </div>
        <div className="relative">
          <div className="relative overflow-hidden rounded-sm border border-white/10 shadow-2xl">
            <Image
              src="/images/hero-site-board.jpg"
              alt="Construction workers at a site entrance before starting work"
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5">
              <p className="text-sm font-medium">Instruction before the job starts</p>
              <p className="text-xs text-white/75">
                HSWA section 2(2)(c): information, instruction, training and supervision.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegalStrip() {
  const duties = ["HSWA 1974 s.2(2)(c)", "MHSWR 1999 reg. 13", "PUWER 1998 reg. 9", "Work at Height 2005"];
  return (
    <div className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-xs font-semibold tracking-[0.14em] text-[hsl(var(--home-ink)/0.7)]">
        {duties.map((duty) => (
          <span key={duty} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" aria-hidden />
            {duty}
          </span>
        ))}
      </div>
    </div>
  );
}

function Catalogue() {
  return (
    <section id="courses" className="container mx-auto scroll-mt-24 px-4 py-20 lg:py-28">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">The catalogue</p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Courses we can deliver without a licensed approval
        </h2>
        <p className="mt-4 text-[hsl(var(--home-ink)/0.72)]">
          Each course follows a written syllabus: planning, the equipment, the
          limits, and what to do when something goes wrong. The employer still
          decides that the course fits the actual job.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {COURSES.map((course) => (
          <article key={course.title} className="flex flex-col border border-[hsl(var(--home-rule))] bg-white p-7">
            <h3 className="font-display text-2xl font-medium tracking-tight">{course.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">{course.audience}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">{course.law}</p>
            <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.78)]">
              {course.topics.map((topic) => (
                <li key={topic} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden />
                  {topic}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button asChild variant="outline" className="bg-transparent">
                <Link href={`/training/enquire?course=${course.key}`}>
                  Book this course
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">How a course runs</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            From the job to a record you can show
          </h2>
        </div>
        <div className="grid gap-10 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.n} className="border-t border-white/15 pt-6">
              <p className="font-display text-sm tracking-[0.2em] text-emerald-300">{step.n}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Boundaries() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">The limit of the catalogue</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
            Competence training, not a card and not a licence
          </h2>
          <p className="mt-4 max-w-xl text-[hsl(var(--home-ink)/0.72)]">
            HSE does not approve a provider for these courses. A voluntary card
            can still be what a principal contractor asks for at the gate. If
            the site requires a named scheme, say so before you book — we will
            not dress this training up as that card.
          </p>
        </div>
        <div className="border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] p-7">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-emerald-800" aria-hidden />
            Not in this catalogue
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.78)]">
            {NOT_OFFERED.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-800" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-[hsl(var(--home-rule))] bg-white py-20 lg:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Frequently asked questions</h2>
        <p className="mt-3 text-[hsl(var(--home-ink)/0.7)]">
          What the law requires, what a card scheme is, and what this training is not.
        </p>
        <div className="mt-10 divide-y divide-[hsl(var(--home-rule))] border-y border-[hsl(var(--home-rule))]">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span className="shrink-0 text-2xl font-light leading-none text-emerald-800 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-[hsl(var(--home-ink)/0.72)]">{faq.answer}</p>
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
              <GraduationCap className="h-4 w-4" aria-hidden />
              Book training for your team
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
              Tell us the machine, the height and the people
            </h2>
            <p className="mt-4 max-w-xl text-white/75">
              We will confirm which course fits, where it can be held, and send
              the invoice. Before the competence record expires we contact you
              so the refresher is booked while people are still in date.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300">
                <Link href="/training/enquire">
                  Book training
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/contact">Contact</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <ul className="space-y-3 text-sm text-white/80">
              {[
                "English delivery, at your workplace",
                "Syllabus tied to the equipment in use",
                "No claim to IPAF, PASMA or CISRS",
                "Scaffold stops at 9 metres",
                "Completions stored in HSEQ Nova",
                "The employer keeps the legal duty",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <HardHat className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
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
