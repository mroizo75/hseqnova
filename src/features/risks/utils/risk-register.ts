import type { RiskControlEffectiveness, RiskControlStatus } from "@prisma/client";

export type ExposureLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export function getExposureLevel(score: number, residualScore?: number | null): ExposureLevel {
  const reference = residualScore && residualScore > 0 ? residualScore : score;

  if (reference >= 20) return "CRITICAL";
  if (reference >= 12) return "HIGH";
  if (reference >= 6) return "MODERATE";
  return "LOW";
}

export function getExposureBadge(level: ExposureLevel) {
  switch (level) {
    case "CRITICAL":
      return { label: "Kritisk", className: "bg-red-100 text-red-800 border-red-200" };
    case "HIGH":
      return { label: "Høy", className: "bg-orange-100 text-orange-900 border-orange-200" };
    case "MODERATE":
      return { label: "Moderat", className: "bg-yellow-100 text-yellow-900 border-yellow-200" };
    default:
      return { label: "Lav", className: "bg-green-100 text-green-900 border-green-200" };
  }
}

interface ControlSummaryInput {
  status: RiskControlStatus;
  effectiveness: RiskControlEffectiveness;
}

export function summarizeControls(controls: ControlSummaryInput[]) {
  return controls.reduce(
    (acc, control) => {
      if (control.status === "ACTIVE" && control.effectiveness === "EFFECTIVE") {
        acc.effective += 1;
      } else if (
        control.status === "NEEDS_IMPROVEMENT" ||
        control.effectiveness === "PARTIAL" ||
        control.effectiveness === "INEFFECTIVE"
      ) {
        acc.gaps += 1;
      } else if (control.status === "RETIRED") {
        acc.retired += 1;
      }
      return acc;
    },
    { effective: 0, gaps: 0, retired: 0 }
  );
}

