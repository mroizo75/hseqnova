import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HmsTrendChart } from "@/features/dashboard/components/hms-trend-chart";
import { RecentIncidentsCard } from "@/features/dashboard/components/recent-incidents-card";
import { cn } from "@/lib/utils";
import {
  buildControlJourney,
  dutyGain,
  type ControlPhase,
  type HseqDutyLevel,
  type HseqDutyStatus,
  type HseqStatusReport,
} from "@/lib/hseq-status";

interface HseqStatusDashboardProps {
  userName: string;
  asOf: string;
  report: HseqStatusReport;
  weeklyTrendData: Array<{ week: string; opened: number; closed: number }>;
  recentIncidents: Array<{
    id: string;
    title: string;
    location: string;
    occurredAt: string;
    status: string;
  }>;
}

const LEVEL_LABEL: Record<HseqDutyLevel, string> = {
  on_track: "In place",
  attention: "Keep going",
  critical: "Do this first",
  gap: "Not started",
};

function greetingName(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) return "there";
  const local = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  return local.split(/\s+/)[0] ?? "there";
}

function heroCopy(
  name: string,
  report: HseqStatusReport,
  mode: "wizard" | "steady",
): { title: string; lede: string } {
  if (report.overallLevel === "critical") {
    return {
      title: `${name}, this comes first`,
      lede: "A legal deadline has passed. Deal with it, then you are back on the path.",
    };
  }
  if (mode === "wizard") {
    return {
      title: `${name}, get control one step at a time`,
      lede: "Each step puts a legal duty on file. You do not have to finish the list today.",
    };
  }
  if (report.overallLevel === "healthy") {
    return {
      title: `${name}, you have this under control`,
      lede: "Live records show the HSEQ duties for this company are in order.",
    };
  }
  return {
    title: `${name}, the foundation is in place`,
    lede: "Keep it running. One follow-up at a time is enough.",
  };
}

function DutyIcon({ level }: { level: HseqDutyLevel }) {
  if (level === "critical") {
    return <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />;
  }
  if (level === "on_track") {
    return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />;
  }
  if (level === "gap") {
    return <CircleDashed className="h-4 w-4 shrink-0" aria-hidden />;
  }
  return <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />;
}

function sortDuties(duties: HseqDutyStatus[]): HseqDutyStatus[] {
  const rank: Record<HseqDutyLevel, number> = {
    critical: 0,
    attention: 1,
    gap: 2,
    on_track: 3,
  };
  return [...duties].sort((a, b) => rank[a.level] - rank[b.level]);
}

export function HseqStatusDashboard({
  userName,
  asOf,
  report,
  weeklyTrendData,
  recentIncidents,
}: HseqStatusDashboardProps) {
  const name = greetingName(userName);
  const journey = buildControlJourney(report);
  const hero = heroCopy(name, report, journey.mode);
  const duties = sortDuties(report.duties);
  const inPlaceCount = journey.inPlace.length;
  const totalCount = report.duties.length;
  const nextStep = journey.nextStep;
  const showPath = journey.mode === "wizard" || report.overallLevel !== "healthy";

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">{asOf}</p>
        <h1 className="mt-1 max-w-2xl text-3xl font-bold tracking-tight text-balance">
          {hero.title}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{hero.lede}</p>
      </header>

      {nextStep && report.overallLevel !== "healthy" ? (
        <section
          aria-labelledby="hseq-next-heading"
          className={cn(
            "overflow-hidden rounded-xl border shadow-sm",
            nextStep.duty.level === "critical"
              ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
              : "bg-card",
          )}
        >
          <div className="grid lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {nextStep.duty.level === "critical"
                  ? "Do this first"
                  : journey.mode === "wizard"
                    ? "Next step"
                    : "Keep going"}
              </p>
              <h2
                id="hseq-next-heading"
                className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-balance"
              >
                {nextStep.action}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{nextStep.why}</p>
              <Button asChild size="lg" className="mt-6">
                <Link href={nextStep.duty.href}>
                  Start this step
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              {journey.critical.length > 1 ? (
                <ul className="mt-6 space-y-2 border-t pt-4">
                  {journey.critical.slice(1).map((duty) => (
                    <li key={duty.key}>
                      <Link
                        href={duty.href}
                        className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium text-red-900 hover:underline dark:text-red-200"
                      >
                        <span>
                          {duty.title}
                          <span className="ml-2 font-normal text-muted-foreground">
                            {duty.headline}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-col justify-between border-t bg-primary/[0.04] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  In place
                </p>
                <p className="mt-3 text-5xl font-semibold tabular-nums tracking-tight text-primary">
                  {inPlaceCount}
                  <span className="ml-1 text-lg font-medium text-muted-foreground">
                    of {totalCount}
                  </span>
                </p>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                {journey.mode === "wizard"
                  ? "Finish the foundation and you have what HSE asks to see first."
                  : "Duties already covered stay here. Only the next follow-up is in front of you."}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="hseq-position-heading"
          className="rounded-xl border bg-primary/5 p-6 sm:p-8"
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            HSEQ position
          </p>
          <p
            id="hseq-position-heading"
            className="mt-3 text-6xl font-semibold tabular-nums leading-none tracking-tight text-primary"
          >
            {report.score}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {inPlaceCount} of {totalCount} duties in place.
          </p>
        </section>
      )}

      {showPath && journey.phases.length > 0 ? (
        <section aria-labelledby="hseq-path-heading" className="space-y-3">
          <div>
            <h2 id="hseq-path-heading" className="text-lg font-semibold tracking-tight">
              The path to control
            </h2>
            <p className="text-sm text-muted-foreground">
              Suggested order. Everything in the menu stays available.
            </p>
          </div>
          <ol className="grid list-none gap-3 p-0 sm:grid-cols-3">
            {journey.phases.map((phase, index) => (
              <PhaseCard key={phase.id} phase={phase} step={index + 1} />
            ))}
          </ol>
        </section>
      ) : null}

      {journey.inPlace.length > 0 && report.overallLevel !== "healthy" ? (
        <section aria-labelledby="hseq-inplace-heading" className="space-y-3">
          <h2 id="hseq-inplace-heading" className="text-lg font-semibold tracking-tight">
            What you already have
          </h2>
          <ul className="flex flex-wrap gap-2">
            {journey.inPlace.map((duty) => (
              <li key={duty.key}>
                <Link
                  href={duty.href}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {dutyGain(duty.key)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {weeklyTrendData.length > 0 || recentIncidents.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {weeklyTrendData.length > 0 ? <HmsTrendChart data={weeklyTrendData} /> : null}
          {recentIncidents.length > 0 ? (
            <RecentIncidentsCard incidents={recentIncidents} />
          ) : null}
        </div>
      ) : null}

      <details className="group rounded-xl border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-medium sm:px-5 [&::-webkit-details-marker]:hidden">
          <span>
            All duties
            <span className="ml-2 font-normal text-muted-foreground">
              Legal register · {totalCount} {totalCount === 1 ? "item" : "items"}
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="divide-y border-t">
          {duties.map((duty) => (
            <li key={duty.key}>
              <Link
                href={duty.href}
                className="group/row flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6 sm:px-5"
              >
                <span
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium sm:w-56",
                    duty.level === "on_track" ? "text-primary" : "text-foreground",
                  )}
                >
                  <DutyIcon level={duty.level} />
                  {duty.title}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {duty.level === "on_track" ? dutyGain(duty.key) : duty.headline}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{duty.detail}</span>
                </span>
                <span className="flex items-center justify-between gap-3 sm:w-52 sm:justify-end">
                  <Badge variant="outline" className="bg-transparent font-normal">
                    {LEVEL_LABEL[duty.level]}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover/row:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function PhaseCard({ phase, step }: { phase: ControlPhase; step: number }) {
  const isCurrent = phase.status === "current";
  const isComplete = phase.status === "complete";
  const href = phase.nextDuty?.href ?? phase.duties[0]?.href;

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
            isComplete && "bg-primary text-primary-foreground",
            isCurrent && "bg-primary/15 text-primary",
            phase.status === "upcoming" && "bg-muted text-muted-foreground",
          )}
        >
          {isComplete ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : step}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {phase.completeCount}/{phase.totalCount}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{phase.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{phase.gain}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {isComplete ? "In place" : isCurrent ? "This step" : "Up next"}
      </p>
    </>
  );

  const className = cn(
    "block h-full rounded-xl border p-5 text-left transition-colors",
    isCurrent && "border-primary/40 bg-primary/[0.04]",
    isComplete && "border-primary/20 bg-primary/[0.03]",
    phase.status === "upcoming" && "bg-card",
    href && "hover:bg-muted/40",
  );

  if (!href) {
    return (
      <li className={className} aria-current={isCurrent ? "step" : undefined}>
        {inner}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className={className}
        aria-current={isCurrent ? "step" : undefined}
      >
        {inner}
      </Link>
    </li>
  );
}
