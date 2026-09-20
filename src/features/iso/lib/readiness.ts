import { ISO_PHASES, type IsoPhaseId } from "@/features/iso/lib/clauses";
import type { IsoClauseStatus, IsoCoverageLevel, IsoEvidenceSnapshot } from "@/features/iso/lib/evidence";

export type IsoAssessedLevel = "COMPLIANT" | "PARTIAL" | "GAP" | "MAJOR_GAP";

export type IsoReadinessGate = {
  id: string;
  label: string;
  met: boolean;
  detail: string;
};

export type IsoChapterLight = {
  id: IsoPhaseId;
  title: string;
  status: "green" | "amber" | "red";
  coveredCount: number;
  totalCount: number;
  majorGaps: number;
};

export type IsoReadinessInput = {
  statuses: IsoClauseStatus[];
  assessments: Array<{
    clauseKey: string;
    assessedLevel: IsoAssessedLevel | null;
  }>;
  snapshot: IsoEvidenceSnapshot;
  openMajorNcCount: number;
  completedIsoAudit: boolean;
  managementReviewWith93: boolean;
  documentedNilReturn: boolean;
};

export type IsoReadiness = {
  ready: boolean;
  percent: number;
  label: "READY" | "NOT READY";
  disclaimer: string;
  gates: IsoReadinessGate[];
  chapters: IsoChapterLight[];
  openGaps: number;
  majorGaps: number;
};

export const ISO_READY_DISCLAIMER =
  "Ready for a UKAS certification audit — the body grants the certificate.";

export function mapAutoToAssessed(level: IsoCoverageLevel): IsoAssessedLevel {
  if (level === "covered") return "COMPLIANT";
  if (level === "partial") return "PARTIAL";
  return "GAP";
}

export function effectiveAssessedLevel(
  auto: IsoCoverageLevel,
  assessed: IsoAssessedLevel | null | undefined,
): IsoAssessedLevel {
  return assessed ?? mapAutoToAssessed(auto);
}

export function buildIsoReadiness(input: IsoReadinessInput): IsoReadiness {
  const assessmentByClause = new Map(
    input.assessments.map((row) => [row.clauseKey, row.assessedLevel] as const),
  );

  const rows = input.statuses.map((status) => {
    const assessed = effectiveAssessedLevel(status.level, assessmentByClause.get(status.clause.id) ?? null);
    return { status, assessed };
  });

  const majorGaps = rows.filter((row) => row.assessed === "MAJOR_GAP").length;
  const openGaps = rows.filter((row) => row.assessed === "GAP" || row.assessed === "MAJOR_GAP").length;
  const compliantCount = rows.filter((row) => row.assessed === "COMPLIANT").length;
  const percent = rows.length === 0 ? 0 : Math.round((compliantCount / rows.length) * 100);

  const livingHierarchy = input.snapshot.riskWithControlsCount > 0;
  const livingIncident =
    input.snapshot.incidentCount > 0 || input.documentedNilReturn;
  const livingAction = input.snapshot.actionsWithEffectiveness > 0;
  const livingConsultation =
    input.snapshot.consultationCount > 0 ||
    input.snapshot.nearMissCount > 0 ||
    input.snapshot.whistleblowingCount > 0;
  const livingPolicy = input.snapshot.policyAcknowledged;
  const livingUse = livingHierarchy && livingIncident && livingAction && livingConsultation && livingPolicy;

  const gates: IsoReadinessGate[] = [
    {
      id: "major-gaps",
      label: "No open major gaps in the matrix",
      met: majorGaps === 0,
      detail:
        majorGaps === 0
          ? "No major gaps are open"
          : `${majorGaps} major gap${majorGaps === 1 ? "" : "s"} still open`,
    },
    {
      id: "internal-audit",
      label: "Internal audit against ISO clauses completed",
      met: input.completedIsoAudit,
      detail: input.completedIsoAudit
        ? "A completed internal audit is linked to ISO 45001 / 9001 clauses"
        : "Complete an internal audit against ISO 45001 or 9001 clauses",
    },
    {
      id: "major-nc",
      label: "Open major nonconformities verified closed",
      met: input.openMajorNcCount === 0,
      detail:
        input.openMajorNcCount === 0
          ? "No unverified major nonconformities"
          : `${input.openMajorNcCount} major NC${input.openMajorNcCount === 1 ? "" : "s"} still not verified closed`,
    },
    {
      id: "management-review",
      label: "Completed management review with ISO 9.3 inputs",
      met: input.managementReviewWith93,
      detail: input.managementReviewWith93
        ? "At least one completed review includes previous actions, interested parties, compliance and consultation"
        : "Complete a management review with the ISO 9.3 inputs",
    },
    {
      id: "living-use",
      label: "The system is in live use — not empty templates",
      met: livingUse,
      detail: livingUse
        ? "Risks with hierarchy controls, accident-book activity, verified actions, consultation and a signed policy are on record"
        : [
            !livingHierarchy ? "Add hierarchy controls on a reviewed risk" : null,
            !livingIncident ? "Record an accident-book entry or a documented nil return" : null,
            !livingAction ? "Close an action with an effectiveness review" : null,
            !livingConsultation ? "Record consultation, a near miss/hazard, or a whistleblowing case" : null,
            !livingPolicy ? "Employees must acknowledge the health and safety policy" : null,
          ]
            .filter(Boolean)
            .join(". "),
    },
  ];

  const chapters: IsoChapterLight[] = ISO_PHASES.map((phase) => {
    const phaseRows = rows.filter((row) => row.status.clause.phase === phase.id);
    const phaseMajor = phaseRows.filter((row) => row.assessed === "MAJOR_GAP").length;
    const coveredCount = phaseRows.filter((row) => row.assessed === "COMPLIANT").length;
    const allCovered = phaseRows.length > 0 && coveredCount === phaseRows.length;
    let status: IsoChapterLight["status"] = "amber";
    if (phaseMajor > 0 || phaseRows.some((row) => row.assessed === "GAP" && coveredCount === 0)) {
      status = "red";
    }
    if (phaseMajor > 0) status = "red";
    else if (allCovered) status = "green";
    else if (coveredCount === 0) status = "red";
    return {
      id: phase.id,
      title: phase.title,
      status,
      coveredCount,
      totalCount: phaseRows.length,
      majorGaps: phaseMajor,
    };
  });

  const ready = gates.every((gate) => gate.met);

  return {
    ready,
    percent,
    label: ready ? "READY" : "NOT READY",
    disclaimer: ISO_READY_DISCLAIMER,
    gates,
    chapters,
    openGaps,
    majorGaps,
  };
}
