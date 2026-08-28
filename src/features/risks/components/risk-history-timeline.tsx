"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  TrendingUp,
  Shield,
  ShieldOff,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface RiskHistoryEntry {
  id: string;
  changeType: string;
  previousScore: number | null;
  newScore: number | null;
  changedFields: string | null;
  changedById: string | null;
  changeNote: string | null;
  createdAt: string;
  changedByName?: string;
}

interface RiskHistoryTimelineProps {
  riskId: string;
  history: RiskHistoryEntry[];
}

const CHANGE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof Plus; colour: string }
> = {
  CREATED: { label: "Created", icon: Plus, colour: "bg-green-100 text-green-700" },
  UPDATED: { label: "Updated", icon: Pencil, colour: "bg-blue-100 text-blue-700" },
  SCORE_CHANGED: { label: "Score changed", icon: TrendingUp, colour: "bg-amber-100 text-amber-700" },
  CONTROL_ADDED: { label: "Control added", icon: Shield, colour: "bg-emerald-100 text-emerald-700" },
  CONTROL_REMOVED: { label: "Control removed", icon: ShieldOff, colour: "bg-red-100 text-red-700" },
  REVIEWED: { label: "Reviewed", icon: CheckCircle2, colour: "bg-purple-100 text-purple-700" },
  CLOSED: { label: "Closed", icon: XCircle, colour: "bg-gray-100 text-gray-700" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseChangedFields(raw: string | null): Record<string, { old: unknown; new: unknown }> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 20
      ? "bg-red-100 text-red-800"
      : score >= 12
        ? "bg-orange-100 text-orange-800"
        : score >= 6
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800";
  return <Badge className={colour}>{score}</Badge>;
}

export function RiskHistoryTimeline({ riskId, history }: RiskHistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version history</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No history recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version history</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border hidden sm:block" />

          {history.map((entry, idx) => {
            const config = CHANGE_TYPE_CONFIG[entry.changeType] ?? {
              label: entry.changeType,
              icon: Clock,
              colour: "bg-gray-100 text-gray-700",
            };
            const Icon = config.icon;
            const fields = parseChangedFields(entry.changedFields);

            return (
              <div key={entry.id} className="relative flex gap-3 sm:gap-4 pb-6 last:pb-0">
                {/* Icon circle */}
                <div
                  className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full ${config.colour}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </span>
                    {entry.changedByName && (
                      <span className="text-xs text-muted-foreground">
                        by {entry.changedByName}
                      </span>
                    )}
                  </div>

                  {/* Score change */}
                  {entry.previousScore != null && entry.newScore != null && (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Score:</span>
                      <ScoreBadge score={entry.previousScore} />
                      <span className="text-muted-foreground">&rarr;</span>
                      <ScoreBadge score={entry.newScore} />
                    </div>
                  )}

                  {/* Changed fields */}
                  {fields && Object.keys(fields).length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {Object.entries(fields).map(([field, val]) => (
                        <div key={field} className="text-xs text-muted-foreground">
                          <span className="font-medium capitalize">
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          :{" "}
                          <span className="line-through">{String(val.old ?? "—")}</span>
                          {" → "}
                          <span>{String(val.new ?? "—")}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {entry.changeNote && (
                    <p className="mt-1 text-sm text-muted-foreground italic">
                      {entry.changeNote}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
