import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Linkedin,
  Clock,
  CalendarCheck,
  LogIn,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCanonicalUrl,
  ROBOTS_CONFIG,
  getOpenGraphDefaults,
  getTwitterDefaults,
  SITE_CONFIG,
} from "@/lib/seo-config";

const pageTitle = "Contact HSEQ Nova | Get in Touch";
const pageDescription =
  "Get in touch with the HSEQ Nova team. Email hello@hseqnova.co.uk or find us on LinkedIn. We respond within one working day, Monday to Friday.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: getCanonicalUrl("/contact") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(pageTitle, pageDescription, "/contact"),
  twitter: getTwitterDefaults(pageTitle, pageDescription),
};

const CONTACT_METHODS = [
  {
    icon: Mail,
    title: "Email",
    detail: SITE_CONFIG.contactEmail,
    href: `mailto:${SITE_CONFIG.contactEmail}`,
    description: "Our primary contact method. Write to us about anything — pricing, a demo, technical questions or partnership enquiries.",
  },
  {
    icon: Linkedin,
    title: "LinkedIn",
    detail: "HSEQ Nova",
    href: SITE_CONFIG.socialMedia.linkedin,
    description: "Follow us for product updates, UK health and safety news and practical guidance.",
  },
] as const;

const DETAILS = [
  {
    icon: Clock,
    title: "Support hours",
    text: "Monday to Friday, 9 am to 5 pm GMT",
  },
  {
    icon: CalendarCheck,
    title: "Response time",
    text: "Within one working day",
  },
  {
    icon: MessageSquare,
    title: "What we can help with",
    text: "Product questions, pricing, onboarding, technical support and feedback",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="home-marketing font-marketing">
      <HeroSection />
      <ContactMethodsSection />
      <DetailsSection />
      <ExistingCustomersSection />
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
      <div className="container relative mx-auto px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Contact
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.12]">
            Talk to us
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80">
            Whether you are evaluating HSEQ Nova for your company, have a question about
            UK health and safety compliance, or want to give us feedback — we would like
            to hear from you.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="h-12 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
            >
              <a href={`mailto:${SITE_CONFIG.contactEmail}`}>
                <Mail className="h-4 w-4" />
                {SITE_CONFIG.contactEmail}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactMethodsSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
          How to reach us
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Simple and direct
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--home-ink)/0.72)]">
          No contact form maze. Write to us and a real person will reply.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-6 md:grid-cols-2">
        {CONTACT_METHODS.map((method) => (
          <a
            key={method.title}
            href={method.href}
            target={method.href.startsWith("http") ? "_blank" : undefined}
            rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group"
          >
            <Card className="h-full border-[hsl(var(--home-rule))] transition-shadow group-hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <method.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <p className="text-sm font-medium text-emerald-800">
                      {method.detail}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
                  {method.description}
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}

function DetailsSection() {
  return (
    <section className="border-y border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))]">
      <div className="container mx-auto px-4 py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            What to expect
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
            We reply quickly and honestly
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-3">
          {DETAILS.map((item) => (
            <div key={item.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-medium tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--home-ink)/0.7)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExistingCustomersSection() {
  return (
    <section className="container mx-auto px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl">
        <Card className="border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10">
              <LogIn className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-display text-xl font-medium">
                Already using HSEQ Nova?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Log into your account for in-app support, documentation and help
                articles. Your account dashboard is the fastest way to get assistance.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              >
                <Link href="/login">
                  Log in to HSEQ Nova
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] py-20 text-[hsl(var(--home-ink-fg))] lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight text-balance md:text-4xl">
          Ready to start?
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/75">
          HSEQ Nova is live and ready for UK employers. Create your account today — Core
          HSEQ is included, with industry add-ons available when you need them.
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
            <a href={`mailto:${SITE_CONFIG.contactEmail}`}>Email us first</a>
          </Button>
        </div>
        <p className="mt-6 text-sm text-white/50">
          {SITE_CONFIG.contactEmail} · Monday to Friday, 9 am to 5 pm GMT
        </p>
      </div>
    </section>
  );
}
