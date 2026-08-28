"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, AlertTriangle, Clock } from "lucide-react";

interface RiddorReportButtonProps {
  incidentId: string;
  riddorCategory: string | null;
  riddorDueAt: string | Date | null;
  riddorReportedAt?: string | Date | null;
}

const DEADLINE_LABELS: Record<string, string> = {
  death: "Notify immediately; written follow-up within 10 days",
  specified_injury: "Report within 10 days",
  over_seven_day: "Report within 15 days from day of incapacity",
  occupational_disease: "Report within 10 days of diagnosis",
  dangerous_occurrence: "Report within 10 days",
};

function getDeadlineStatus(dueAt: Date | null): {
  label: string;
  isOverdue: boolean;
  daysRemaining: number;
} {
  if (!dueAt) return { label: "No deadline set", isOverdue: false, daysRemaining: 0 };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueAt);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  let label: string;
  if (isOverdue) {
    label = `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? "s" : ""}`;
  } else if (daysRemaining === 0) {
    label = "Due today";
  } else {
    label = `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`;
  }

  return { label, isOverdue, daysRemaining };
}

export function RiddorReportButton({
  incidentId,
  riddorCategory,
  riddorDueAt,
  riddorReportedAt,
}: RiddorReportButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const dueDate = riddorDueAt ? new Date(riddorDueAt) : null;
  const { label: deadlineLabel, isOverdue, daysRemaining } = getDeadlineStatus(dueDate);
  const deadlineDescription = riddorCategory
    ? DEADLINE_LABELS[riddorCategory] ?? ""
    : "";
  const alreadyReported = Boolean(riddorReportedAt);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/riddor-pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `F2508-${incidentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Error is visible to user via browser download failure
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
        <span className="text-sm font-semibold text-orange-900">RIDDOR Notification</span>
        {alreadyReported && (
          <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
            Reported
          </Badge>
        )}
      </div>

      {deadlineDescription && (
        <p className="text-xs text-orange-800">{deadlineDescription}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-orange-600 shrink-0" />
        <Badge
          variant="outline"
          className={
            isOverdue
              ? "border-red-300 bg-red-100 text-red-800"
              : daysRemaining <= 3
                ? "border-amber-300 bg-amber-100 text-amber-800"
                : "border-orange-300 bg-orange-100 text-orange-800"
          }
        >
          {deadlineLabel}
        </Badge>
        {dueDate && (
          <span className="text-xs text-muted-foreground">
            (due {dueDate.toLocaleDateString("en-GB")})
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className="w-fit bg-transparent text-foreground hover:bg-muted"
      >
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        <FileText className="mr-1.5 h-4 w-4" />
        Generate F2508 Report
      </Button>
    </div>
  );
}
