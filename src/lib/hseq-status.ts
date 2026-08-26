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
    title: "Fire drills",
    legalRef: "Fire Safety Order 2005",
    href: "/dashboard/fire-drills",
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
    title: "Audits",
    legalRef: "ISO 45001",
    href: "/dashboard/audits",
    moduleKey: "audits",
  },
  {
    key: "environment",
    title: "Environment",
    legalRef: "ISO 14001",
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
  fireDrills: { hasAny: boolean; completedInLastYear: boolean };
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
  if (!input.hasAny) {
    return {
      level: "gap",
      headline: "No drills recorded",
      detail: "The responsible person must plan and record fire drills.",
    };
  }
  if (!input.completedInLastYear) {
    return {
      level: "attention",
      headline: "No drill in 12 months",
      detail: "HSE expects regular drills. Record the next one.",
    };
  }
  return {
    level: "on_track",
    headline: "Drilled this year",
    detail: "A completed drill is on record in the last 12 months.",
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
      level: "attention",
      headline: "No audits scheduled",
      detail: "Internal audit is how the system is checked.",
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
      level: "gap",
      headline: "No aspects recorded",
      detail: "Identify significant environmental aspects and keep them under review.",
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
