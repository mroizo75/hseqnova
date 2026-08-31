import { tenantHasModule } from "@/lib/tenant-modules";

export type HseqDutyKey =
  | "policy"
  | "risks"
  | "incidents"
  | "actions"
  | "inspections"
  | "fireDrills"
  | "training"
  | "documents"
  | "sja"
  | "chemicals"
  | "exposureRegister"
  | "constructionCompliance"
  | "audits"
  | "environment";

export type HseqDutyLevel = "on_track" | "attention" | "critical" | "gap";
export type HseqOverallLevel = "healthy" | "attention" | "critical";

export interface HseqDutyDefinition {
  key: HseqDutyKey;
  title: string;
  legalRef: string;
  href: string;
  moduleKey: string;
}

export const HSEQ_DUTY_DEFINITIONS: readonly HseqDutyDefinition[] = [
  {
    key: "policy",
    title: "Health and safety policy",
    legalRef: "HSWA 1974 s.2(3)",
    href: "/dashboard/health-safety-policy",
    moduleKey: "hmsHandbok",
  },
  {
    key: "risks",
    title: "Risk assessments",
    legalRef: "MHSWR 1999",
    href: "/dashboard/risks",
    moduleKey: "risks",
  },
  {
    key: "incidents",
    title: "Accident book",
    legalRef: "RIDDOR 2013",
    href: "/dashboard/incidents",
    moduleKey: "incidents",
  },
  {
    key: "actions",
    title: "Actions",
    legalRef: "MHSWR 1999",
    href: "/dashboard/actions",
    moduleKey: "actions",
  },
  {
    key: "inspections",
    title: "Workplace inspections",
    legalRef: "MHSWR 1999",
    href: "/dashboard/inspections",
    moduleKey: "inspections",
  },
  {
    key: "fireDrills",
    title: "Fire safety",
    legalRef: "FSO 2005 arts 9 and 15",
    href: "/dashboard/fire-risk",
    moduleKey: "fireDrills",
  },
  {
    key: "training",
    title: "Training and competence",
    legalRef: "HSWA 1974 s.2(2)(c)",
    href: "/dashboard/training",
    moduleKey: "training",
  },
  {
    key: "documents",
    title: "Controlled documents",
    legalRef: "HSWA 1974 s.2 arrangements",
    href: "/dashboard/documents",
    moduleKey: "documents",
  },
  {
    key: "sja",
    title: "RAMS",
    legalRef: "MHSWR 1999; CDM 2015",
    href: "/dashboard/sja",
    moduleKey: "sja",
  },
  {
    key: "chemicals",
    title: "COSHH",
    legalRef: "COSHH 2002",
    href: "/dashboard/chemicals",
    moduleKey: "chemicals",
  },
  {
    key: "exposureRegister",
    title: "Exposure register",
    legalRef: "COSHH 2002 — health records 40 years",
    href: "/dashboard/exposure-register",
    moduleKey: "chemicals",
  },
  {
    key: "constructionCompliance",
    title: "CDM",
    legalRef: "CDM 2015",
    href: "/dashboard/construction-compliance",
    moduleKey: "constructionCompliance",
  },
  {
    key: "audits",
    title: "Internal audit",
    legalRef: "ISO 45001 — voluntary, not a GB duty",
    href: "/dashboard/audits",
    moduleKey: "audits",
  },
  {
    key: "environment",
    title: "Environment",
    legalRef: "ISO 14001 — voluntary overlay",
    href: "/dashboard/environment",
    moduleKey: "environment",
  },
] as const;

export interface HseqDutyStatus {
  key: HseqDutyKey;
  title: string;
  legalRef: string;
  href: string;
  level: HseqDutyLevel;
  headline: string;
  detail: string;
}

export interface HseqStatusReport {
  overallLevel: HseqOverallLevel;
  score: number;
  duties: HseqDutyStatus[];
  onTrackCount: number;
  attentionCount: number;
  criticalCount: number;
}

export interface HseqStatusInput {
  now: Date;
  enabledModules: Iterable<string>;
  allowedKeys: Iterable<HseqDutyKey>;
  policy: { hasPublished: boolean; lastReviewedAt: string | null };
  risks: { total: number; criticalCount: number; overdueReviewCount: number };
  incidents: { openCount: number; overdueRiddorCount: number; pendingRiddorCount: number };
  actions: { overdueCount: number; openCount: number };
  inspections: { total: number; overdueCount: number };
  fireDrills: {
    hasAny: boolean;
    completedInLastYear: boolean;
    hasRecordedAssessment: boolean;
    assessmentReviewOverdue: boolean;
  };
  training: { expiredCount: number };
  documents: { total: number };
  sja?: { total: number };
  chemicals?: { total: number; missingSdsCount: number; overdueReviewCount: number };
  exposureRegister?: { total: number };
  constructionCompliance?: { projectCount: number; missingCppCount: number };
  audits?: { total: number; overdueCount: number; upcomingCount: number };
  environment?: { total: number };
}

const LEVEL_SCORE: Record<HseqDutyLevel, number> = {
  on_track: 100,
  attention: 55,
  gap: 30,
  critical: 10,
};

const MS_PER_DAY = 86_400_000;
const POLICY_REVIEW_DAYS = 365;
const CRITICAL_ACTION_THRESHOLD = 5;
const CRITICAL_TRAINING_THRESHOLD = 5;

export function visibleHseqDuties(
  enabledModules: Iterable<string>,
  allowedKeys: Iterable<HseqDutyKey>,
): HseqDutyDefinition[] {
  const allowed = new Set(allowedKeys);
  return HSEQ_DUTY_DEFINITIONS.filter((duty) => {
    if (!allowed.has(duty.key)) return false;
    return tenantHasModule(enabledModules, duty.moduleKey);
  });
}

export function monthsSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const days = (now.getTime() - then.getTime()) / MS_PER_DAY;
  return Math.floor(days / 30);
}

function evaluatePolicy(
  input: HseqStatusInput["policy"],
  now: Date,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (!input.hasPublished) {
    return {
      level: "gap",
      headline: "No written policy",
      detail: "Employers with five or more employees must have a written policy.",
    };
  }
  const reviewed = input.lastReviewedAt ? new Date(input.lastReviewedAt) : null;
  const stale =
    !reviewed ||
    Number.isNaN(reviewed.getTime()) ||
    now.getTime() - reviewed.getTime() > POLICY_REVIEW_DAYS * MS_PER_DAY;
  if (stale) {
    const months = monthsSince(input.lastReviewedAt, now);
    return {
      level: "attention",
      headline: "Review overdue",
      detail:
        months === null
          ? "No review date recorded. HSE expects an annual review."
          : `Last reviewed ${months} months ago. HSE expects an annual review.`,
    };
  }
  const months = monthsSince(input.lastReviewedAt, now) ?? 0;
  return {
    level: "on_track",
    headline: "Current",
    detail: `Last reviewed ${months === 0 ? "this month" : `${months} months ago`}.`,
  };
}

function evaluateRisks(
  input: HseqStatusInput["risks"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "gap",
      headline: "No assessments",
      detail: "A suitable and sufficient risk assessment is required.",
    };
  }
  if (input.criticalCount > 0) {
    return {
      level: "critical",
      headline: `${input.criticalCount} critical ${input.criticalCount === 1 ? "risk" : "risks"}`,
      detail: "Score 15 or above. Reduce or control before work continues.",
    };
  }
  if (input.overdueReviewCount > 0) {
    return {
      level: "attention",
      headline: `${input.overdueReviewCount} overdue ${input.overdueReviewCount === 1 ? "review" : "reviews"}`,
      detail: "Assessments must stay suitable and sufficient.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} live ${input.total === 1 ? "assessment" : "assessments"}`,
    detail: "No critical scores and no overdue reviews.",
  };
}

function evaluateIncidents(
  input: HseqStatusInput["incidents"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.overdueRiddorCount > 0) {
    return {
      level: "critical",
      headline: `${input.overdueRiddorCount} overdue RIDDOR ${input.overdueRiddorCount === 1 ? "report" : "reports"}`,
      detail: "Report to HSE without delay, within 10 days, or within 15 days as required.",
    };
  }
  if (input.pendingRiddorCount > 0) {
    return {
      level: "attention",
      headline: `${input.pendingRiddorCount} RIDDOR ${input.pendingRiddorCount === 1 ? "report" : "reports"} due`,
      detail: "Reportable events are waiting to be submitted to HSE.",
    };
  }
  if (input.openCount > 0) {
    return {
      level: "attention",
      headline: `${input.openCount} open ${input.openCount === 1 ? "entry" : "entries"}`,
      detail: "Accident book entries still under investigation or follow-up.",
    };
  }
  return {
    level: "on_track",
    headline: "No open entries",
    detail: "No overdue or pending RIDDOR reports.",
  };
}

function evaluateActions(
  input: HseqStatusInput["actions"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.overdueCount >= CRITICAL_ACTION_THRESHOLD) {
    return {
      level: "critical",
      headline: `${input.overdueCount} overdue actions`,
      detail: "Corrective actions have passed their due date.",
    };
  }
  if (input.overdueCount > 0) {
    return {
      level: "attention",
      headline: `${input.overdueCount} overdue ${input.overdueCount === 1 ? "action" : "actions"}`,
      detail: "Close or re-date actions that have passed their due date.",
    };
  }
  if (input.openCount > 0) {
    return {
      level: "on_track",
      headline: `${input.openCount} open ${input.openCount === 1 ? "action" : "actions"}`,
      detail: "None are overdue.",
    };
  }
  return {
    level: "on_track",
    headline: "No open actions",
    detail: "Nothing waiting for follow-up.",
  };
}

function evaluateInspections(
  input: HseqStatusInput["inspections"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "gap",
      headline: "No inspections",
      detail: "Workplace inspections show that arrangements are working.",
    };
  }
  if (input.overdueCount > 0) {
    return {
      level: "attention",
      headline: `${input.overdueCount} overdue ${input.overdueCount === 1 ? "inspection" : "inspections"}`,
      detail: "Scheduled inspections have passed their date.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} recorded`,
    detail: "No overdue workplace inspections.",
  };
}

function evaluateFireDrills(
  input: HseqStatusInput["fireDrills"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (!input.hasRecordedAssessment) {
    return {
      level: "gap",
      headline: "No recorded fire risk assessment",
      detail: "The responsible person must record a suitable and sufficient assessment (art.9).",
    };
  }
  if (input.assessmentReviewOverdue) {
    return {
      level: "attention",
      headline: "Fire risk assessment review overdue",
      detail: "Keep the assessment up to date (art.9(3)).",
    };
  }
  if (!input.hasAny || !input.completedInLastYear) {
    return {
      level: "attention",
      headline: "No drill in 12 months",
      detail: "Drills test the fire risk assessment (art.15). Record the next one.",
    };
  }
  return {
    level: "on_track",
    headline: "Assessment and drill current",
    detail: "A recorded assessment and a drill in the last 12 months.",
  };
}

function evaluateTraining(
  input: HseqStatusInput["training"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.expiredCount >= CRITICAL_TRAINING_THRESHOLD) {
    return {
      level: "critical",
      headline: `${input.expiredCount} expired records`,
      detail: "Competence has lapsed. Plan renewals before the work is done.",
    };
  }
  if (input.expiredCount > 0) {
    return {
      level: "attention",
      headline: `${input.expiredCount} expired ${input.expiredCount === 1 ? "record" : "records"}`,
      detail: "Renew training before it blocks competent work.",
    };
  }
  return {
    level: "on_track",
    headline: "Competence current",
    detail: "No expired training records.",
  };
}

function evaluateDocuments(
  input: HseqStatusInput["documents"],
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "gap",
      headline: "No documents",
      detail: "Arrangements should be written down and controlled.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} controlled ${input.total === 1 ? "document" : "documents"}`,
    detail: "Versioned records are in place.",
  };
}

function evaluateSja(
  input: NonNullable<HseqStatusInput["sja"]>,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "gap",
      headline: "No RAMS",
      detail: "Method statements sit with the risk assessment for the task.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} RAMS`,
    detail: "Task-specific assessments are on file.",
  };
}

function evaluateChemicals(
  input: NonNullable<HseqStatusInput["chemicals"]>,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "gap",
      headline: "No COSHH register",
      detail: "Assess substances hazardous to health before they are used.",
    };
  }
  if (input.missingSdsCount > 0) {
    return {
      level: "attention",
      headline: `${input.missingSdsCount} missing SDS`,
      detail: "Safety data sheets are part of a COSHH assessment.",
    };
  }
  if (input.overdueReviewCount > 0) {
    return {
      level: "attention",
      headline: `${input.overdueReviewCount} overdue COSHH ${input.overdueReviewCount === 1 ? "review" : "reviews"}`,
      detail: "Assessments must stay current when the work or the substance changes.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} substances`,
    detail: "SDS and review dates are in place.",
  };
}

function evaluateExposure(
  input: NonNullable<HseqStatusInput["exposureRegister"]>,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "attention",
      headline: "No health records",
      detail: "COSHH health records must be kept for 40 years where surveillance is required.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} health ${input.total === 1 ? "record" : "records"}`,
    detail: "Retention is set for 40 years.",
  };
}

function evaluateCdm(
  input: NonNullable<HseqStatusInput["constructionCompliance"]>,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.projectCount === 0) {
    return {
      level: "gap",
      headline: "No construction projects",
      detail: "CDM duty holders, CPP and F10 live against a project.",
    };
  }
  if (input.missingCppCount > 0) {
    return {
      level: "attention",
      headline: `${input.missingCppCount} ${input.missingCppCount === 1 ? "project" : "projects"} without a CPP`,
      detail: "A construction phase plan is required before construction starts.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.projectCount} ${input.projectCount === 1 ? "project" : "projects"}`,
    detail: "Each project has a construction phase plan.",
  };
}

function evaluateAudits(
  input: NonNullable<HseqStatusInput["audits"]>,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.overdueCount > 0) {
    return {
      level: "attention",
      headline: `${input.overdueCount} overdue ${input.overdueCount === 1 ? "audit" : "audits"}`,
      detail: "Scheduled audits have passed their date.",
    };
  }
  if (input.upcomingCount > 0) {
    return {
      level: "attention",
      headline: `${input.upcomingCount} in the next 7 days`,
      detail: "Prepare evidence and the audit team.",
    };
  }
  if (input.total === 0) {
    return {
      level: "on_track",
      headline: "ISO overlay unused",
      detail: "Internal audit is ISO 45001 — not a GB legal duty. MHSWR reg.5 review is management review.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} recorded`,
    detail: "No overdue or imminent audits.",
  };
}

function evaluateEnvironment(
  input: NonNullable<HseqStatusInput["environment"]>,
): Pick<HseqDutyStatus, "level" | "headline" | "detail"> {
  if (input.total === 0) {
    return {
      level: "on_track",
      headline: "ISO overlay unused",
      detail: "ISO 14001 is voluntary. It is not a GB health and safety duty.",
    };
  }
  return {
    level: "on_track",
    headline: `${input.total} ${input.total === 1 ? "aspect" : "aspects"}`,
    detail: "Environmental aspects are on file.",
  };
}

const EVALUATORS: {
  [K in HseqDutyKey]: (
    input: HseqStatusInput,
  ) => Pick<HseqDutyStatus, "level" | "headline" | "detail"> | null;
} = {
  policy: (input) => evaluatePolicy(input.policy, input.now),
  risks: (input) => evaluateRisks(input.risks),
  incidents: (input) => evaluateIncidents(input.incidents),
  actions: (input) => evaluateActions(input.actions),
  inspections: (input) => evaluateInspections(input.inspections),
  fireDrills: (input) => evaluateFireDrills(input.fireDrills),
  training: (input) => evaluateTraining(input.training),
  documents: (input) => evaluateDocuments(input.documents),
  sja: (input) => (input.sja ? evaluateSja(input.sja) : null),
  chemicals: (input) => (input.chemicals ? evaluateChemicals(input.chemicals) : null),
  exposureRegister: (input) =>
    input.exposureRegister ? evaluateExposure(input.exposureRegister) : null,
  constructionCompliance: (input) =>
    input.constructionCompliance ? evaluateCdm(input.constructionCompliance) : null,
  audits: (input) => (input.audits ? evaluateAudits(input.audits) : null),
  environment: (input) => (input.environment ? evaluateEnvironment(input.environment) : null),
};

function overallFromDuties(duties: HseqDutyStatus[]): HseqOverallLevel {
  if (duties.some((duty) => duty.level === "critical")) return "critical";
  if (duties.some((duty) => duty.level === "attention" || duty.level === "gap")) {
    return "attention";
  }
  return "healthy";
}

export function evaluateHseqStatus(input: HseqStatusInput): HseqStatusReport {
  const visible = visibleHseqDuties(input.enabledModules, input.allowedKeys);
  const duties = visible
    .map((definition) => {
      const result = EVALUATORS[definition.key](input);
      if (!result) return null;
      return {
        key: definition.key,
        title: definition.title,
        legalRef: definition.legalRef,
        href: definition.href,
        ...result,
      } satisfies HseqDutyStatus;
    })
    .filter((duty): duty is HseqDutyStatus => duty !== null);

  const score =
    duties.length === 0
      ? 0
      : Math.round(
          duties.reduce((sum, duty) => sum + LEVEL_SCORE[duty.level], 0) / duties.length,
        );

  return {
    overallLevel: overallFromDuties(duties),
    score,
    duties,
    onTrackCount: duties.filter((duty) => duty.level === "on_track").length,
    attentionCount: duties.filter(
      (duty) => duty.level === "attention" || duty.level === "gap",
    ).length,
    criticalCount: duties.filter((duty) => duty.level === "critical").length,
  };
}

export type ControlPhaseId = "foundation" | "operations" | "specialist";
export type ControlPhaseStatus = "complete" | "current" | "upcoming";
export type ControlJourneyMode = "wizard" | "steady";

export interface ControlPhase {
  id: ControlPhaseId;
  title: string;
  gain: string;
  duties: HseqDutyStatus[];
  completeCount: number;
  totalCount: number;
  nextDuty: HseqDutyStatus | null;
  status: ControlPhaseStatus;
}

export interface ControlNextStep {
  duty: HseqDutyStatus;
  action: string;
  why: string;
}

export interface ControlJourney {
  mode: ControlJourneyMode;
  phases: ControlPhase[];
  nextStep: ControlNextStep | null;
  inPlace: HseqDutyStatus[];
  critical: HseqDutyStatus[];
}

const PHASE_DEFS: ReadonlyArray<{
  id: ControlPhaseId;
  title: string;
  gain: string;
  keys: readonly HseqDutyKey[];
}> = [
  {
    id: "foundation",
    title: "Foundation",
    gain: "A written policy and risk assessments — what HSE asks to see first.",
    keys: ["policy", "risks", "documents"],
  },
  {
    id: "operations",
    title: "Day to day",
    gain: "The accident book, inspections, fire safety and training are running.",
    keys: ["incidents", "actions", "inspections", "fireDrills", "training"],
  },
  {
    id: "specialist",
    title: "Extra duties",
    gain: "Specialist records for the work this company actually does.",
    keys: [
      "sja",
      "chemicals",
      "exposureRegister",
      "constructionCompliance",
      "audits",
      "environment",
    ],
  },
];

const DUTY_GAIN: Record<HseqDutyKey, string> = {
  policy: "Written policy covered",
  risks: "Risk assessments on file",
  incidents: "Accident book under control",
  actions: "Actions on time",
  inspections: "Inspections running",
  fireDrills: "Fire safety current",
  training: "Competence current",
  documents: "Arrangements written down",
  sja: "RAMS on file",
  chemicals: "COSHH register live",
  exposureRegister: "Health records kept",
  constructionCompliance: "CDM duties recorded",
  audits: "Internal audit running",
  environment: "Aspects identified",
};

const DUTY_ACTION: Record<HseqDutyKey, Partial<Record<HseqDutyLevel, string>>> = {
  policy: {
    gap: "Publish a written health and safety policy",
    attention: "Review the health and safety policy",
  },
  risks: {
    gap: "Record the first risk assessment",
    attention: "Review overdue risk assessments",
    critical: "Reduce or control the critical risks",
  },
  incidents: {
    gap: "Open the accident book",
    attention: "Follow up open accident book entries",
    critical: "Report overdue RIDDOR to HSE",
  },
  actions: {
    attention: "Close overdue actions",
    critical: "Close overdue actions",
  },
  inspections: {
    gap: "Record the first workplace inspection",
    attention: "Complete overdue workplace inspections",
  },
  fireDrills: {
    gap: "Record the fire risk assessment",
    attention: "Review the fire risk assessment or record this year’s drill",
  },
  training: {
    attention: "Renew expired training",
    critical: "Renew expired training",
  },
  documents: {
    gap: "Add the first controlled document",
  },
  sja: {
    gap: "Write the first RAMS",
  },
  chemicals: {
    gap: "Start the COSHH register",
    attention: "Bring COSHH assessments up to date",
  },
  exposureRegister: {
    attention: "Start COSHH health records",
  },
  constructionCompliance: {
    gap: "Add a construction project",
    attention: "Add a construction phase plan",
  },
  audits: {
    attention: "Schedule or complete an internal audit",
  },
  environment: {
    gap: "Record environmental aspects",
  },
};

const DUTY_WHY: Record<HseqDutyKey, string> = {
  policy: "Then the HSWA s.2(3) duty is covered — statement, organisation and arrangements.",
  risks: "Then you have a suitable and sufficient assessment on file (MHSWR 1999).",
  incidents: "Then the accident book and RIDDOR reporting are under control.",
  actions: "Then corrective actions are on time.",
  inspections: "Then workplace inspections show the arrangements are working.",
  fireDrills: "Then fire safety is recorded: assessment (art.9) and a drill this year (art.15).",
  training: "Then competence records are current (HSWA s.2(2)(c)).",
  documents: "Then the arrangements are written down and versioned.",
  sja: "Then task-specific method statements sit with the assessment.",
  chemicals: "Then substances hazardous to health are assessed before use.",
  exposureRegister: "Then COSHH health records are kept for 40 years.",
  constructionCompliance: "Then CDM duty holders and the construction phase plan are on file.",
  audits: "Then the management system is being checked.",
  environment: "Then significant environmental aspects are identified.",
};

export function dutyGain(key: HseqDutyKey): string {
  return DUTY_GAIN[key];
}

function dutyAction(duty: HseqDutyStatus): string {
  return DUTY_ACTION[duty.key][duty.level] ?? duty.headline;
}

function isIncomplete(duty: HseqDutyStatus): boolean {
  return duty.level !== "on_track";
}

function firstIncomplete(duties: HseqDutyStatus[]): HseqDutyStatus | null {
  return duties.find(isIncomplete) ?? null;
}

export function buildControlJourney(report: HseqStatusReport): ControlJourney {
  const byKey = new Map(report.duties.map((duty) => [duty.key, duty]));
  const critical = report.duties.filter((duty) => duty.level === "critical");
  const inPlace = report.duties.filter((duty) => duty.level === "on_track");

  const rawPhases = PHASE_DEFS.map((definition) => {
    const duties = definition.keys
      .map((key) => byKey.get(key))
      .filter((duty): duty is HseqDutyStatus => duty !== undefined);
    return { definition, duties };
  }).filter((phase) => phase.duties.length > 0);

  const foundationGaps = rawPhases
    .find((phase) => phase.definition.id === "foundation")
    ?.duties.some((duty) => duty.level === "gap");
  const mode: ControlJourneyMode = foundationGaps ? "wizard" : "steady";

  let currentAssigned = false;
  const phases: ControlPhase[] = rawPhases.map(({ definition, duties }) => {
    const completeCount = duties.filter((duty) => duty.level === "on_track").length;
    const complete = completeCount === duties.length;
    let status: ControlPhaseStatus;
    if (complete) {
      status = "complete";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    } else {
      status = "upcoming";
    }
    return {
      id: definition.id,
      title: definition.title,
      gain: definition.gain,
      duties,
      completeCount,
      totalCount: duties.length,
      nextDuty: firstIncomplete(duties),
      status,
    };
  });

  const currentPhase = phases.find((phase) => phase.status === "current");
  const nextDuty =
    critical[0] ?? currentPhase?.nextDuty ?? firstIncomplete(report.duties);

  const nextStep: ControlNextStep | null = nextDuty
    ? {
        duty: nextDuty,
        action: dutyAction(nextDuty),
        why: DUTY_WHY[nextDuty.key],
      }
    : null;

  return { mode, phases, nextStep, inPlace, critical };
}
