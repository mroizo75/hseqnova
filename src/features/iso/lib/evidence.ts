import {
  ALL_ISO_CLAUSES,
  ISO_PHASES,
  type IsoClause,
  type IsoEvidenceKey,
  type IsoPhaseId,
} from "@/features/iso/lib/clauses";

export type IsoCoverageLevel = "covered" | "partial" | "missing";

export type IsoEvidenceSnapshot = {
  contextCount: number;
  interestedPartyCount: number;
  hasScope: boolean;
  scopeApproved: boolean;
  hasQualityScope: boolean;
  policyPublished: boolean;
  policyAcknowledged: boolean;
  hasQualityPolicy: boolean;
  orgNodeCount: number;
  consultationCount: number;
  riskAssessmentCount: number;
  riskWithControlsCount: number;
  opportunityCount: number;
  legalRequirementCount: number;
  evaluatedLegalCount: number;
  objectiveCount: number;
  expiredTrainingCount: number;
  trainingRecordCount: number;
  documentCount: number;
  inspectionCount: number;
  hasRams: boolean;
  hasCoshh: boolean;
  changeCount: number;
  contractorCount: number;
  fireDrillInYear: boolean;
  fireAssessment: boolean;
  completedAuditCount: number;
  auditWithIsoClauses: boolean;
  completedReviewCount: number;
  incidentCount: number;
  nearMissCount: number;
  whistleblowingCount: number;
  actionsWithEffectiveness: number;
  openActionCount: number;
};

export type IsoClauseStatus = {
  clause: IsoClause;
  level: IsoCoverageLevel;
  detail: string;
};

export type IsoPhaseProgress = {
  id: IsoPhaseId;
  title: string;
  gain: string;
  completeCount: number;
  totalCount: number;
  status: "complete" | "current" | "upcoming";
  next: IsoClauseStatus | null;
  clauses: IsoClauseStatus[];
};

export type IsoJourney = {
  mode: "wizard" | "steady";
  phases: IsoPhaseProgress[];
  nextStep: IsoClauseStatus | null;
  coveredCount: number;
  totalCount: number;
  percent: number;
};

function levelFor(covered: boolean, partial: boolean): IsoCoverageLevel {
  if (covered) return "covered";
  if (partial) return "partial";
  return "missing";
}

export function evaluateEvidenceKey(
  key: IsoEvidenceKey,
  snap: IsoEvidenceSnapshot,
): { level: IsoCoverageLevel; detail: string } {
  switch (key) {
    case "context":
      return {
        level: levelFor(snap.contextCount >= 2, snap.contextCount > 0),
        detail:
          snap.contextCount >= 2
            ? `${snap.contextCount} context issues recorded`
            : snap.contextCount === 1
              ? "Add at least one more internal or external issue"
              : "No context issues recorded",
      };
    case "interestedParties":
      return {
        level: levelFor(snap.interestedPartyCount >= 2, snap.interestedPartyCount > 0),
        detail:
          snap.interestedPartyCount > 0
            ? `${snap.interestedPartyCount} interested parties`
            : "No interested parties recorded",
      };
    case "scope":
      return {
        level: levelFor(snap.scopeApproved, snap.hasScope),
        detail: snap.scopeApproved
          ? "Scope approved"
          : snap.hasScope
            ? "Scope drafted — needs approval"
            : "OH&S / QMS scope not written",
      };
    case "policy":
      return {
        level: levelFor(snap.policyPublished, false),
        detail: snap.policyPublished ? "Health and safety policy published" : "Publish the written policy",
      };
    case "qualityPolicy":
      return {
        level: levelFor(snap.hasQualityPolicy || snap.hasQualityScope, snap.policyPublished),
        detail: snap.hasQualityPolicy || snap.hasQualityScope
          ? "Quality policy or quality scope is on file"
          : "Add a quality policy section or controlled document",
      };
    case "roles":
      return {
        level: levelFor(snap.orgNodeCount >= 2, snap.orgNodeCount > 0),
        detail:
          snap.orgNodeCount > 0
            ? `${snap.orgNodeCount} roles on the organisation chart`
            : "Organisation chart is empty",
      };
    case "consultation":
      return {
        level: levelFor(snap.consultationCount > 0, false),
        detail:
          snap.consultationCount > 0
            ? `${snap.consultationCount} consultation meetings`
            : "Record the first consultation meeting",
      };
    case "risks":
      return {
        level: levelFor(snap.riskAssessmentCount > 0, false),
        detail:
          snap.riskAssessmentCount > 0
            ? `${snap.riskAssessmentCount} risk assessments`
            : "Record the first risk assessment",
      };
    case "opportunities":
      return {
        level: levelFor(snap.opportunityCount > 0, snap.riskAssessmentCount > 0),
        detail:
          snap.opportunityCount > 0
            ? `${snap.opportunityCount} opportunities recorded`
            : "Add at least one OH&S or quality opportunity",
      };
    case "legalRegister":
      return {
        level: levelFor(snap.legalRequirementCount >= 3, snap.legalRequirementCount > 0),
        detail:
          snap.legalRequirementCount > 0
            ? `${snap.legalRequirementCount} legal / other requirements`
            : "Start the legal register",
      };
    case "complianceEvaluation":
      return {
        level: levelFor(
          snap.legalRequirementCount > 0 && snap.evaluatedLegalCount === snap.legalRequirementCount,
          snap.evaluatedLegalCount > 0,
        ),
        detail:
          snap.legalRequirementCount === 0
            ? "Add legal requirements first"
            : `${snap.evaluatedLegalCount} of ${snap.legalRequirementCount} evaluated`,
      };
    case "objectives":
      return {
        level: levelFor(snap.objectiveCount > 0, false),
        detail: snap.objectiveCount > 0 ? `${snap.objectiveCount} objectives` : "Set the first measurable objective",
      };
    case "competence":
      return {
        level: levelFor(snap.trainingRecordCount > 0 && snap.expiredTrainingCount === 0, snap.trainingRecordCount > 0),
        detail:
          snap.trainingRecordCount === 0
            ? "No training records"
            : snap.expiredTrainingCount > 0
              ? `${snap.expiredTrainingCount} expired training records`
              : "Competence records are current",
      };
    case "awareness":
      return {
        level: levelFor(snap.policyAcknowledged, snap.policyPublished),
        detail: snap.policyAcknowledged
          ? "Employees have been notified of the policy"
          : "Notify employees of the current policy",
      };
    case "communication":
      return {
        level: levelFor(snap.interestedPartyCount > 0 && snap.policyPublished, snap.policyPublished),
        detail: snap.interestedPartyCount > 0
          ? "Interested-party communication methods recorded"
          : "Record how you communicate OH&S information",
      };
    case "documents":
      return {
        level: levelFor(snap.documentCount > 0, false),
        detail: snap.documentCount > 0 ? `${snap.documentCount} controlled documents` : "Add the first controlled document",
      };
    case "operationalControl":
      return {
        level: levelFor(
          snap.inspectionCount > 0 || snap.hasRams || snap.hasCoshh,
          false,
        ),
        detail:
          snap.inspectionCount > 0 || snap.hasRams || snap.hasCoshh
            ? "Operational controls are in use"
            : "Record inspections, RAMS or COSHH for the work you do",
      };
    case "hierarchy":
      return {
        level: levelFor(snap.riskWithControlsCount > 0, snap.riskAssessmentCount > 0),
        detail:
          snap.riskWithControlsCount > 0
            ? `${snap.riskWithControlsCount} risks with hierarchy controls`
            : "Add controls on significant risks (eliminate → PPE)",
      };
    case "moc":
      return {
        level: levelFor(snap.changeCount > 0, false),
        detail: snap.changeCount > 0 ? `${snap.changeCount} managed changes` : "Record the first planned change",
      };
    case "procurement":
      return {
        level: levelFor(snap.contractorCount > 0, false),
        detail:
          snap.contractorCount > 0
            ? `${snap.contractorCount} contractor records`
            : "Add contractors you use, or document why none apply",
      };
    case "emergency":
      return {
        level: levelFor(snap.fireAssessment && snap.fireDrillInYear, snap.fireAssessment || snap.fireDrillInYear),
        detail:
          snap.fireAssessment && snap.fireDrillInYear
            ? "Fire risk assessment and a drill this year"
            : "Complete the fire risk assessment and record a drill",
      };
    case "monitoring":
      return {
        level: levelFor(snap.inspectionCount > 0 || snap.objectiveCount > 0, false),
        detail:
          snap.inspectionCount > 0 || snap.objectiveCount > 0
            ? "Monitoring is running"
            : "Use inspections or objectives to monitor performance",
      };
    case "customer":
      return {
        level: levelFor(snap.interestedPartyCount > 0, false),
        detail: "Customer and interested-party needs are on the register",
      };
    case "internalAudit":
      return {
        level: levelFor(snap.completedAuditCount > 0 && snap.auditWithIsoClauses, snap.completedAuditCount > 0),
        detail:
          snap.completedAuditCount === 0
            ? "No completed internal audit"
            : snap.auditWithIsoClauses
              ? `${snap.completedAuditCount} completed audits`
              : "Complete an audit against ISO 45001 or 9001 clauses",
      };
    case "managementReview":
      return {
        level: levelFor(snap.completedReviewCount > 0, false),
        detail:
          snap.completedReviewCount > 0
            ? `${snap.completedReviewCount} completed management reviews`
            : "Complete the first management review",
      };
    case "incidents":
      return {
        level: levelFor(snap.incidentCount > 0, false),
        detail:
          snap.incidentCount > 0
            ? `${snap.incidentCount} accident-book entries`
            : "Open the accident book — even a nil return shows the process",
      };
    case "correctiveAction":
      return {
        level: levelFor(snap.actionsWithEffectiveness > 0, snap.openActionCount > 0),
        detail:
          snap.actionsWithEffectiveness > 0
            ? `${snap.actionsWithEffectiveness} actions with effectiveness recorded`
            : "Close actions with an effectiveness review",
      };
    case "continualImprovement":
      return {
        level: levelFor(
          snap.actionsWithEffectiveness > 0 && snap.completedReviewCount > 0,
          snap.openActionCount > 0 || snap.completedAuditCount > 0,
        ),
        detail:
          snap.actionsWithEffectiveness > 0
            ? "Improvement actions are being verified"
            : "Raise and verify improvement actions from audits and incidents",
      };
    default:
      return { level: "missing", detail: "Not evaluated" };
  }
}

export function evaluateIsoClauses(snap: IsoEvidenceSnapshot): IsoClauseStatus[] {
  return ALL_ISO_CLAUSES.map((clause) => {
    const result = evaluateEvidenceKey(clause.evidenceKey, snap);
    return { clause, ...result };
  });
}

export function buildIsoJourney(statuses: IsoClauseStatus[]): IsoJourney {
  let currentAssigned = false;
  const phases: IsoPhaseProgress[] = ISO_PHASES.map((phase) => {
    const clauses = statuses.filter((item) => item.clause.phase === phase.id);
    const completeCount = clauses.filter((item) => item.level === "covered").length;
    const complete = clauses.length > 0 && completeCount === clauses.length;
    let status: IsoPhaseProgress["status"];
    if (complete) {
      status = "complete";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    } else {
      status = "upcoming";
    }
    return {
      id: phase.id,
      title: phase.title,
      gain: phase.gain,
      completeCount,
      totalCount: clauses.length,
      status,
      next: clauses.find((item) => item.level !== "covered") ?? null,
      clauses,
    };
  });

  const coveredCount = statuses.filter((item) => item.level === "covered").length;
  const foundationMissing = phases[0]?.clauses.some((item) => item.level === "missing") ?? false;
  const current = phases.find((phase) => phase.status === "current");
  const nextStep =
    statuses.find((item) => item.level === "missing") ??
    current?.next ??
    statuses.find((item) => item.level !== "covered") ??
    null;

  return {
    mode: foundationMissing ? "wizard" : "steady",
    phases,
    nextStep,
    coveredCount,
    totalCount: statuses.length,
    percent: statuses.length === 0 ? 0 : Math.round((coveredCount / statuses.length) * 100),
  };
}

export const EMPTY_ISO_SNAPSHOT: IsoEvidenceSnapshot = {
  contextCount: 0,
  interestedPartyCount: 0,
  hasScope: false,
  scopeApproved: false,
  hasQualityScope: false,
  policyPublished: false,
  policyAcknowledged: false,
  hasQualityPolicy: false,
  orgNodeCount: 0,
  consultationCount: 0,
  riskAssessmentCount: 0,
  riskWithControlsCount: 0,
  opportunityCount: 0,
  legalRequirementCount: 0,
  evaluatedLegalCount: 0,
  objectiveCount: 0,
  expiredTrainingCount: 0,
  trainingRecordCount: 0,
  documentCount: 0,
  inspectionCount: 0,
  hasRams: false,
  hasCoshh: false,
  changeCount: 0,
  contractorCount: 0,
  fireDrillInYear: false,
  fireAssessment: false,
  completedAuditCount: 0,
  auditWithIsoClauses: false,
  incidentCount: 0,
  nearMissCount: 0,
  whistleblowingCount: 0,
  actionsWithEffectiveness: 0,
  openActionCount: 0,
  completedReviewCount: 0,
};
