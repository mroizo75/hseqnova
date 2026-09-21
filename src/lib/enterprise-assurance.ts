import type { EnterpriseAssuranceBand, EnterpriseDomainKey, EnterpriseTrend } from "@prisma/client";
import type { HseqDutyKey, HseqDutyLevel, HseqStatusReport } from "@/lib/hseq-status";

export type DomainBandMap = Partial<Record<EnterpriseDomainKey, EnterpriseAssuranceBand>>;

export type StandardRequirementInput = {
  domainKey: EnterpriseDomainKey;
  ruleKey: string;
  threshold: number | null;
};

export type StandardEvaluation = {
  met: boolean;
  ruleKey: string;
  domainKey: EnterpriseDomainKey;
};

export type AssuranceResult = {
  overallPercent: number;
  overallBand: EnterpriseAssuranceBand;
  domainBands: DomainBandMap;
  requirementResults: StandardEvaluation[];
  metCount: number;
  totalRequirements: number;
};

const DUTY_TO_DOMAIN: Partial<Record<HseqDutyKey, EnterpriseDomainKey>> = {
  risks: "RISKS",
  sja: "RAMS",
  chemicals: "COSHH",
  incidents: "INCIDENTS",
  actions: "ACTIONS",
  training: "TRAINING",
  inspections: "INSPECTIONS",
  audits: "AUDITS",
  documents: "DOCUMENTS",
};

export function dutyLevelToBand(level: HseqDutyLevel): EnterpriseAssuranceBand {
  if (level === "on_track") return "GREEN";
  if (level === "critical") return "RED";
  return "AMBER";
}

export function isoPercentToBand(percent: number): EnterpriseAssuranceBand {
  if (percent >= 80) return "GREEN";
  if (percent >= 50) return "AMBER";
  return "RED";
}

export function percentToBand(percent: number): EnterpriseAssuranceBand {
  if (percent >= 75) return "GREEN";
  if (percent >= 50) return "AMBER";
  return "RED";
}

export function domainBandsFromHseq(
  report: HseqStatusReport,
  iso45001Percent: number | null,
  iso9001Percent: number | null,
  managementReviewCurrent: boolean | null,
): DomainBandMap {
  const bands: DomainBandMap = {};
  for (const duty of report.duties) {
    const domain = DUTY_TO_DOMAIN[duty.key];
    if (domain) bands[domain] = dutyLevelToBand(duty.level);
  }
  if (iso45001Percent !== null) bands.ISO_45001 = isoPercentToBand(iso45001Percent);
  if (iso9001Percent !== null) bands.ISO_9001 = isoPercentToBand(iso9001Percent);
  if (managementReviewCurrent !== null) {
    bands.MANAGEMENT_REVIEW = managementReviewCurrent ? "GREEN" : "AMBER";
  }
  bands.ACTIVITY = report.overallLevel === "healthy" ? "GREEN" : report.overallLevel === "critical" ? "RED" : "AMBER";
  return bands;
}

function dutyBand(report: HseqStatusReport, key: HseqDutyKey): EnterpriseAssuranceBand | null {
  const duty = report.duties.find((row) => row.key === key);
  return duty ? dutyLevelToBand(duty.level) : null;
}

export function evaluateStandardRequirement(
  requirement: StandardRequirementInput,
  report: HseqStatusReport,
  iso45001Percent: number | null,
  iso9001Percent: number | null,
  managementReviewCurrent: boolean | null,
): boolean {
  const threshold = requirement.threshold ?? 0;
  switch (requirement.ruleKey) {
    case "risks_current":
      return dutyBand(report, "risks") === "GREEN";
    case "coshh_current":
      return dutyBand(report, "chemicals") === "GREEN";
    case "rams_current":
      return dutyBand(report, "sja") === "GREEN";
    case "training_current":
      return dutyBand(report, "training") === "GREEN";
    case "inspections_monthly":
      return dutyBand(report, "inspections") !== "RED" && dutyBand(report, "inspections") !== null;
    case "critical_actions_resolved":
      return dutyBand(report, "actions") !== "RED";
    case "incidents_investigated":
      return dutyBand(report, "incidents") !== "RED";
    case "management_review_completed":
      return managementReviewCurrent === true;
    case "iso45001_ready":
      return iso45001Percent !== null && iso45001Percent >= (threshold || 80);
    case "iso9001_ready":
      return iso9001Percent !== null && iso9001Percent >= (threshold || 80);
    default:
      return dutyBand(report, requirement.domainKey.toLowerCase() as HseqDutyKey) === "GREEN";
  }
}

export function evaluateAssurance(input: {
  report: HseqStatusReport;
  iso45001Percent: number | null;
  iso9001Percent: number | null;
  managementReviewCurrent: boolean | null;
  requirements: StandardRequirementInput[];
}): AssuranceResult {
  const domainBands = domainBandsFromHseq(
    input.report,
    input.iso45001Percent,
    input.iso9001Percent,
    input.managementReviewCurrent,
  );

  const requirementResults = input.requirements.map((requirement) => ({
    ruleKey: requirement.ruleKey,
    domainKey: requirement.domainKey,
    met: evaluateStandardRequirement(
      requirement,
      input.report,
      input.iso45001Percent,
      input.iso9001Percent,
      input.managementReviewCurrent,
    ),
  }));

  const metCount = requirementResults.filter((row) => row.met).length;
  const totalRequirements = requirementResults.length;
  const overallPercent =
    totalRequirements > 0
      ? Math.round((metCount / totalRequirements) * 100)
      : input.report.score;

  return {
    overallPercent,
    overallBand: percentToBand(overallPercent),
    domainBands,
    requirementResults,
    metCount,
    totalRequirements,
  };
}

export function trendFromPercents(previous: number | null, current: number): EnterpriseTrend {
  if (previous === null) return "STABLE";
  const delta = current - previous;
  if (delta >= 3) return "IMPROVING";
  if (delta <= -3) return "DETERIORATING";
  return "STABLE";
}

export function overviewCounts(bands: Iterable<EnterpriseAssuranceBand>): {
  companies: number;
  goodStanding: number;
  attentionRequired: number;
  criticalAttention: number;
} {
  let goodStanding = 0;
  let attentionRequired = 0;
  let criticalAttention = 0;
  let companies = 0;
  for (const band of bands) {
    companies += 1;
    if (band === "GREEN") goodStanding += 1;
    else if (band === "AMBER") attentionRequired += 1;
    else criticalAttention += 1;
  }
  return { companies, goodStanding, attentionRequired, criticalAttention };
}
