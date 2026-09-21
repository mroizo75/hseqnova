import { ISO_PHASES, type IsoPhaseId } from "@/features/iso/lib/clauses";
import type { IsoClauseStatus, IsoCoverageLevel, IsoEvidenceSnapshot } from "@/features/iso/lib/evidence";
import { missingControlledDocumentClauses } from "@/features/iso/lib/documented-information";

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
    {
      id: "document-control",
      label: "Documented information is controlled (ISO 7.5)",
      met: input.snapshot.documentControlAdequate,
      detail: input.snapshot.documentControlAdequate
        ? "Approved documents have an owner, version and next review date"
        : "Approve at least one controlled document with an owner and review date — drafts are not evidence",
    },
    {
      id: "clause-procedures",
      label: "Required procedures are attached to the clauses they support",
      met: missingControlledDocumentClauses(input.snapshot.approvedClauseKeys).length === 0,
      detail:
        missingControlledDocumentClauses(input.snapshot.approvedClauseKeys).length === 0
          ? "Each clause that needs a procedure has an approved document linked"
          : `Attach an approved document on: ${missingControlledDocumentClauses(input.snapshot.approvedClauseKeys)
              .map((clause) => `${clause.standard === "ISO_45001" ? "45001" : "9001"} ${clause.clause}`)
              .join(", ")}`,
    },
    {
      id: "qms-processes",
      label: "QMS processes are named (ISO 9001 4.4)",
      met: input.snapshot.processCount >= 2,
      detail:
        input.snapshot.processCount >= 2
          ? `${input.snapshot.processCount} processes on the register`
          : "Name at least two processes (for example enquiry-to-delivery and inspection/handover)",
    },
    {
      id: "customer-satisfaction",
      label: "Customer perception is monitored (ISO 9001 9.1.2)",
      met: input.snapshot.customerFeedbackCount > 0,
      detail:
        input.snapshot.customerFeedbackCount > 0
          ? `${input.snapshot.customerFeedbackCount} customer feedback records`
          : "Record customer feedback — praise, complaint or survey — with what you did about it",
    },
    {
      id: "design-scope",
      label: "ISO 9001 8.3 is excluded with justification, or design records exist",
      met: input.snapshot.excludeDesignJustified || input.snapshot.approvedClauseKeys.includes("9001-8.3"),
      detail: input.snapshot.excludeDesignJustified
        ? "Design and development (8.3) is excluded under 4.3 with a written justification"
        : input.snapshot.approvedClauseKeys.includes("9001-8.3")
          ? "Design records are linked to clause 8.3"
          : "Most contractors exclude 8.3 — tick it on the approved scope and write why",
    },
    {
      id: "both-standards-audit",
      label: "Internal audit sampled both ISO 45001 and ISO 9001",
      met: input.snapshot.auditCovers45001 && input.snapshot.auditCovers9001,
      detail:
        input.snapshot.auditCovers45001 && input.snapshot.auditCovers9001
          ? "Completed findings are linked to both standards"
          : "Complete internal audit findings against ISO 45001 and ISO 9001 clauses",
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
