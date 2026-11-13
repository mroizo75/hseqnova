"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Factory, HardHat, HeartPulse, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assessSafetyCheck,
  BOOK_DEMO_URL,
  SAFETY_CHECK_DISCLAIMER,
  SAFETY_INDUSTRIES,
  type ScoreBand,
} from "@/lib/safety-check";
import { submitSafetyCheck } from "@/server/actions/safety-check.actions";

const ICONS = {
  construction: HardHat,
  manufacturing: Factory,
  office: Building2,
  care: HeartPulse,
  transport: Truck,
} as const;

type Step =
  | { name: "industry" }
  | { name: "question"; industryId: string; index: number; answerIds: string[] }
  | { name: "details"; industryId: string; answerIds: string[] }
  | { name: "result"; industryId: string; answerIds: string[] };

const BAND_TONE: Record<ScoreBand, string> = {
  priority: "text-amber-800 bg-amber-50 border-amber-200",
  strengthen: "text-sky-900 bg-sky-50 border-sky-200",
  maintain: "text-emerald-900 bg-emerald-50 border-emerald-200",
};

export function SafetyCheck() {
  const [step, setStep] = useState<Step>({ name: "industry" });
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const industry =
    step.name === "industry" ? undefined : SAFETY_INDUSTRIES.find((item) => item.id === step.industryId);

  return (
    <div>
      <section className="relative overflow-hidden bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div className="container relative mx-auto px-4 py-14 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-5 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Free safety check
            </p>
            <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl">
              Workplace safety check
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-white/80">
              Six questions for your industry. You get a score out of 100 and a short list of what to look at next.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          {step.name === "industry" ? (
            <IndustryStep
              onSelect={(industryId) => {
                setError(null);
                setStep({ name: "question", industryId, index: 0, answerIds: [] });
              }}
            />
          ) : null}

          {step.name === "question" && industry ? (
            <QuestionStep
              key={industry.questions[step.index]!.id}
              industryTitle={industry.title}
              question={industry.questions[step.index]!}
              index={step.index}
              selectedId={step.answerIds[step.index]}
              onBack={() => {
                setError(null);
                if (step.index === 0) {
                  setStep({ name: "industry" });
                  return;
                }
                setStep({ ...step, index: step.index - 1 });
              }}
              onNext={(answerId) => {
                setError(null);
                const answerIds = step.answerIds.slice();
                answerIds[step.index] = answerId;
                if (step.index === industry.questions.length - 1) {
                  setStep({ name: "details", industryId: step.industryId, answerIds });
                  return;
                }
                setStep({ ...step, index: step.index + 1, answerIds });
              }}
            />
          ) : null}

          {step.name === "details" ? (
            <DetailsStep
              name={name}
              company={company}
              email={email}
              consent={consent}
              website={website}
              error={error}
              pending={pending}
              onName={setName}
              onCompany={setCompany}
              onEmail={setEmail}
              onConsent={setConsent}
              onWebsite={setWebsite}
              onBack={() => {
                setError(null);
                setStep({
                  name: "question",
                  industryId: step.industryId,
                  index: 5,
                  answerIds: step.answerIds,
                });
              }}
              onSubmit={async () => {
                setError(null);
                setPending(true);
                try {
                  const response = await submitSafetyCheck({
                    name,
                    company,
                    email,
                    consent,
                    industryId: step.industryId,
                    answerIds: step.answerIds,
                    website,
                  });
                  if (response.success === false) {
                    setError(response.error.message);
                    return;
                  }
                  setStep({
                    name: "result",
                    industryId: step.industryId,
                    answerIds: step.answerIds,
                  });
                } catch {
                  setError("We could not send your results just now. Email callum@hseqnova.co.uk and we will pick it up.");
                } finally {
                  setPending(false);
                }
              }}
            />
          ) : null}

          {step.name === "result" ? <ResultStep industryId={step.industryId} answerIds={step.answerIds} /> : null}
        </div>
      </section>
    </div>
  );
}

function IndustryStep({ onSelect }: { onSelect: (industryId: string) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-medium tracking-tight">Which work should we check?</h2>
      <p className="mt-2 text-muted-foreground">
        Pick the pathway closest to your workplace. It takes about three minutes.
      </p>
      <ul className="mt-6 grid gap-3">
        {SAFETY_INDUSTRIES.map((industry) => {
          const Icon = ICONS[industry.id as keyof typeof ICONS];
          return (
            <li key={industry.id}>
              <button
                type="button"
                onClick={() => onSelect(industry.id)}
                className="flex w-full items-center gap-4 rounded-lg border bg-background px-4 py-4 text-left transition-colors hover:border-primary hover:bg-muted/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{industry.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{industry.summary}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Disclaimer />
    </div>
  );
}

function QuestionStep({
  industryTitle,
  question,
  index,
  selectedId,
  onBack,
  onNext,
}: {
  industryTitle: string;
  question: (typeof SAFETY_INDUSTRIES)[number]["questions"][number];
  index: number;
  selectedId: string | undefined;
  onBack: () => void;
  onNext: (answerId: string) => void;
}) {
  const [choice, setChoice] = useState(selectedId ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!choice) {
          setLocalError("Choose an answer to continue.");
          return;
        }
        onNext(choice);
      }}
    >
      <p className="text-sm font-medium text-muted-foreground">
        {industryTitle} · Question {index + 1} of 6
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-primary" style={{ width: `${((index + 1) / 6) * 100}%` }} />
      </div>
      <fieldset className="mt-6">
        <legend className="font-display text-2xl font-medium tracking-tight text-balance">{question.prompt}</legend>
        <p className="mt-2 text-sm text-muted-foreground">{question.legalHook}</p>
        <div className="mt-5 grid gap-3">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                choice === option.id ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={choice === option.id}
                onChange={() => {
                  setChoice(option.id);
                  setLocalError(null);
                }}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {localError ? <p className="mt-4 text-sm text-destructive">{localError}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button type="submit">
          {index === 5 ? "Continue" : "Next"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}

function DetailsStep({
  name,
  company,
  email,
  consent,
  website,
  error,
  pending,
  onName,
  onCompany,
  onEmail,
  onConsent,
  onWebsite,
  onBack,
  onSubmit,
}: {
  name: string;
  company: string;
  email: string;
  consent: boolean;
  website: string;
  error: string | null;
  pending: boolean;
  onName: (value: string) => void;
  onCompany: (value: string) => void;
  onEmail: (value: string) => void;
  onConsent: (value: boolean) => void;
  onWebsite: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="font-display text-2xl font-medium tracking-tight">See your score</h2>
      <p className="mt-2 text-muted-foreground">
        Your name, company, email and answers are emailed to {`callum@hseqnova.co.uk`} so we can follow up on this
        check. We use them to respond to your enquiry. We do not add you to a general mailing list.
      </p>
      <div className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="safety-check-name">Name</Label>
          <Input
            id="safety-check-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => onName(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="safety-check-company">Company</Label>
          <Input
            id="safety-check-company"
            name="organization"
            autoComplete="organization"
            value={company}
            onChange={(event) => onCompany(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="safety-check-email">Email</Label>
          <Input
            id="safety-check-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmail(event.target.value)}
            required
          />
        </div>
        <div className="hidden" aria-hidden>
          <label htmlFor="safety-check-website">Website</label>
          <input
            id="safety-check-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => onWebsite(event.target.value)}
          />
        </div>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-primary"
            checked={consent}
            onChange={(event) => onConsent(event.target.checked)}
          />
          <span>
            I agree that HSEQ Nova may email me about this safety check and contact me to discuss the results. See our{" "}
            <a href="/personvern" className="underline underline-offset-2">
              privacy policy
            </a>
            .
          </span>
        </label>
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <Disclaimer />
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Show my result"}
        </Button>
      </div>
    </form>
  );
}

function ResultStep({ industryId, answerIds }: { industryId: string; answerIds: string[] }) {
  const result = assessSafetyCheck(industryId, answerIds);
  if (!result) return null;

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{result.industryTitle}</p>
      <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={result.score} />
        <div>
          <p className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${BAND_TONE[result.band]}`}>
            {result.bandTitle}
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight">{result.score} out of 100</h2>
        </div>
      </div>
      <p className="mt-6 text-lg leading-relaxed">{result.message}</p>
      <div className="mt-6 rounded-xl border bg-[hsl(var(--home-ink))] p-5 text-[hsl(var(--home-ink-fg))] sm:p-6">
        <Button asChild size="lg" className="w-full bg-white text-[hsl(var(--home-ink))] hover:bg-white/90 sm:w-auto">
          <a href={BOOK_DEMO_URL}>Book a demo</a>
        </Button>
      </div>
      <h3 className="mt-8 font-display text-xl font-medium">What to look at next</h3>
      <ul className="mt-3 grid gap-3">
        {result.recommendations.map((item) => (
          <li key={item} className="rounded-lg border bg-background px-4 py-3 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">Your results have been sent to HSEQ Nova.</p>
      <Disclaimer />
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg viewBox="0 0 140 140" className="h-32 w-32 text-primary" role="img" aria-label={`${score} out of 100`}>
      <circle cx="70" cy="70" r={radius} className="text-muted" stroke="currentColor" strokeWidth="10" fill="none" />
      <circle
        cx="70"
        cy="70"
        r={radius}
        stroke="currentColor"
        strokeWidth="10"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="78" textAnchor="middle" fill="currentColor" fontSize="32" fontFamily="inherit">
        {score}
      </text>
    </svg>
  );
}

function Disclaimer() {
  return (
    <p className="mt-6 rounded-lg border border-dashed px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      {SAFETY_CHECK_DISCLAIMER}
    </p>
  );
}
