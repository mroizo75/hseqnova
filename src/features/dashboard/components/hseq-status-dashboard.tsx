import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HmsTrendChart } from "@/features/dashboard/components/hms-trend-chart";
import { RecentIncidentsCard } from "@/features/dashboard/components/recent-incidents-card";
import { cn } from "@/lib/utils";
import type { HseqDutyLevel, HseqDutyStatus, HseqStatusReport } from "@/lib/hseq-status";

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
  on_track: "On track",
  attention: "Needs attention",
  critical: "Critical",
  gap: "Not started",
};

const OVERALL_COPY: Record<
  HseqStatusReport["overallLevel"],
  { title: string; lede: string }
> = {
  healthy: {
    title: "On track",
    lede: "Live records show the HSEQ duties for this company are in order.",
  },
  attention: {
    title: "Needs attention",
    lede: "Some duties are missing, overdue or still open. Work the list below.",
  },
  critical: {
    title: "Action required",
    lede: "At least one legal duty is overdue. Deal with the critical items first.",
  },
};

function levelTone(level: HseqDutyLevel | HseqStatusReport["overallLevel"]) {
  if (level === "critical") {
    return {
      text: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
      bar: "bg-red-600",
      border: "border-red-200 dark:border-red-900",
    };
  }
  if (level === "attention" || level === "gap") {
    return {
      text: "text-amber-800 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      bar: "bg-amber-500",
      border: "border-amber-200 dark:border-amber-900",
    };
  }
  return {
    text: "text-primary",
    bg: "bg-primary/5",
    bar: "bg-primary",
    border: "border-primary/20",
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
  const overall = OVERALL_COPY[report.overallLevel];
  const tone = levelTone(report.overallLevel);
  const duties = sortDuties(report.duties);
  const actionDuties = duties.filter((duty) => duty.level !== "on_track");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{asOf}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome, {userName}</h1>
        <p className="mt-1 text-muted-foreground">
          HSEQ position for this company — only the modules you have.
        </p>
      </div>

      <section
        aria-labelledby="hseq-position-heading"
        className={cn("overflow-hidden rounded-xl border", tone.border, tone.bg)}
      >
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,16rem)_1fr] lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              HSEQ position
            </p>
            <p
              id="hseq-position-heading"
              className={cn(
                "mt-3 text-7xl font-semibold tabular-nums leading-none tracking-tight",
                tone.text,
              )}
            >
              {report.score}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">of 100</p>
          </div>
          <div className="space-y-4">
            <div>
              <h2 className={cn("text-2xl font-semibold tracking-tight", tone.text)}>
                {overall.title}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{overall.lede}</p>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-background/80"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={report.score}
              aria-label="HSEQ position score"
            >
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", tone.bar)}
                style={{ width: `${report.score}%` }}
              />
            </div>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Critical</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.criticalCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Need action</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.attentionCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">On track</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums">{report.onTrackCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {actionDuties.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Follow up now
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {actionDuties.map((duty) => {
              const dutyTone = levelTone(duty.level);
              return (
                <Link
                  key={duty.key}
                  href={duty.href}
                  className="flex items-start justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{duty.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{duty.headline}</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 bg-transparent", dutyTone.text, dutyTone.border)}
                  >
                    {LEVEL_LABEL[duty.level]}
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="hseq-duties-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="hseq-duties-heading" className="text-lg font-semibold tracking-tight">
              Duty register
            </h2>
            <p className="text-sm text-muted-foreground">
              Each row is a live duty. Add-ons appear only when the company has that module.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <ul className="divide-y">
            {duties.map((duty) => {
              const dutyTone = levelTone(duty.level);
              return (
                <li key={duty.key}>
                  <Link
                    href={duty.href}
                    className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-6 sm:px-5"
                  >
                    <span
                      className={cn("hidden h-10 w-1 rounded-full sm:block", dutyTone.bar)}
                      aria-hidden
                    />
                    <span className={cn("flex items-center gap-2 text-sm font-medium sm:w-56", dutyTone.text)}>
                      <DutyIcon level={duty.level} />
                      {duty.title}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{duty.headline}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{duty.detail}</span>
                    </span>
                    <span className="flex items-center justify-between gap-3 sm:w-52 sm:justify-end">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {duty.legalRef}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {weeklyTrendData.length > 0 || recentIncidents.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {weeklyTrendData.length > 0 ? <HmsTrendChart data={weeklyTrendData} /> : null}
          {recentIncidents.length > 0 ? (
            <RecentIncidentsCard incidents={recentIncidents} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
