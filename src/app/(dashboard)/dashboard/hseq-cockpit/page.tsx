"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  GraduationCap,
  Shield,
  ClipboardList,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/activity-timeline";
import { cn } from "@/lib/utils";

interface CockpitData {
  openIncidents: number;
  overdueMeasures: number;
  upcomingMeasures: Array<{ id: string; title: string; dueAt: string; status: string }>;
  expiringTraining: number;
  upcomingInspections: Array<{ id: string; title: string; scheduledDate: string; status: string }>;
  overdueDocReviews: number;
  plannedAudits: Array<{ id: string; title: string; scheduledDate: string; status: string }>;
  openRisks: number;
  hmsScore: {
    overallScore: number;
    trend: string;
    incidentScore: number;
    routineScore: number;
    inspectionScore: number;
    trainingScore: number;
    riskScore: number;
    measureScore: number;
    handbookScore: number;
    openIncidents: number;
    overdueMeasures: number;
    expiredTraining: number;
  } | null;
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const variants = {
    default: "border-border",
    warning: "border-amber-300 bg-amber-50/50",
    danger: "border-red-300 bg-red-50/50",
    success: "border-emerald-300 bg-emerald-50/50",
  };

  const iconColours = {
    default: "text-muted-foreground",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-emerald-600",
  };

  return (
    <Link href={href}>
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", variants[variant])}>
        <CardContent className="flex items-center gap-4 p-4">
          <Icon className={cn("h-8 w-8 shrink-0", iconColours[variant])} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ScoreGauge({ score, trend }: { score: number; trend: string }) {
  const TrendIcon = trend === "IMPROVING" ? TrendingUp : trend === "DECLINING" ? TrendingDown : Minus;
  const trendColour = trend === "IMPROVING" ? "text-emerald-600" : trend === "DECLINING" ? "text-red-600" : "text-slate-500";
  const scoreColour = score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-4xl font-bold", scoreColour)}>{score}</span>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span className={cn("flex items-center gap-1 text-xs font-medium", trendColour)}>
          <TrendIcon className="h-3 w-3" />
          {trend === "IMPROVING" ? "Improving" : trend === "DECLINING" ? "Declining" : "Stable"}
        </span>
      </div>
    </div>
  );
}

export default function HseqCockpitPage() {
  const [data, setData] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hseq-cockpit/overview")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">HSEQ Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">HSEQ Overview</h1>
        <p className="text-muted-foreground mt-2">Failed to load dashboard data.</p>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HSEQ Overview</h1>
          <p className="text-muted-foreground text-sm">
            Company-wide health, safety, environment and quality status
          </p>
        </div>
        {data.hmsScore && (
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Compliance score
              </span>
              <ScoreGauge score={data.hmsScore.overallScore} trend={data.hmsScore.trend} />
            </div>
          </Card>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open incidents"
          value={data.openIncidents}
          icon={AlertTriangle}
          href="/dashboard/incidents"
          variant={data.openIncidents > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Overdue actions"
          value={data.overdueMeasures}
          icon={Clock}
          href="/dashboard/actions"
          variant={data.overdueMeasures > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Training expiring"
          value={data.expiringTraining}
          icon={GraduationCap}
          href="/dashboard/training"
          variant={data.expiringTraining > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Documents due review"
          value={data.overdueDocReviews}
          icon={FileWarning}
          href="/dashboard/documents"
          variant={data.overdueDocReviews > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Open risks"
          value={data.openRisks}
          icon={Shield}
          href="/dashboard/risks"
          variant={data.openRisks > 5 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Actions due this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingMeasures.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                <CheckCircle2 className="inline h-4 w-4 mr-1 text-emerald-500" />
                No actions due in the next 7 days.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.upcomingMeasures.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/dashboard/actions`}
                      className="flex items-center justify-between text-sm hover:bg-muted rounded px-2 py-1.5 -mx-2"
                    >
                      <span className="truncate">{m.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatDate(m.dueAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Scheduled activities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Scheduled activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingInspections.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Inspections</p>
                <ul className="space-y-1">
                  {data.upcomingInspections.map((i) => (
                    <li key={i.id}>
                      <Link
                        href={`/dashboard/inspections/${i.id}`}
                        className="flex items-center justify-between text-sm hover:bg-muted rounded px-2 py-1 -mx-2"
                      >
                        <span className="truncate">{i.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatDate(i.scheduledDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.plannedAudits.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Audits</p>
                <ul className="space-y-1">
                  {data.plannedAudits.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/dashboard/audits/${a.id}`}
                        className="flex items-center justify-between text-sm hover:bg-muted rounded px-2 py-1 -mx-2"
                      >
                        <span className="truncate">{a.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatDate(a.scheduledDate)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.upcomingInspections.length === 0 && data.plannedAudits.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming activities scheduled.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent activity timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline tenantWide limit={10} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
