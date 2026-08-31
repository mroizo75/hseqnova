/**
 * Compliance Score Calculator
 *
 * Calculates a percentage score (0–100) based on UK legal duties.
 * Each check maps to a specific regulation and awards points
 * when the organisation meets its statutory obligation.
 */

import { getAdminDb } from "@/lib/supabase/admin";
import { tenantHasModule } from "@/lib/tenant-modules";
import { assessOrgChartCoverage } from "@/lib/org-chart-duties";

export interface ComplianceCheckResult {
  key: string;
  label: string;
  legalRef: string;
  maxPoints: number;
  earnedPoints: number;
  status: "pass" | "attention" | "fail";
  detail: string;
}

export interface ComplianceScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  checks: ComplianceCheckResult[];
  calculatedAt: Date;
}

const MS_PER_DAY = 86_400_000;
const TWELVE_MONTHS_MS = 365 * MS_PER_DAY;
const SIX_MONTHS_MS = 182 * MS_PER_DAY;

function daysSince(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY);
}

export async function calculateComplianceScore(
  tenantId: string,
): Promise<ComplianceScore> {
  const db = getAdminDb();
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getTime() - TWELVE_MONTHS_MS).toISOString();
  const sixMonthsAgo = new Date(now.getTime() - SIX_MONTHS_MS).toISOString();
  const threeYearsAgo = new Date(now.getTime() - 3 * 365 * MS_PER_DAY).toISOString();

  const { data: tenant } = await db
    .from("Tenant")
    .select("id, name, enabledModules")
    .eq("id", tenantId)
    .single();

  const enabledModules: string[] = (tenant?.enabledModules as string[]) ?? [];
  const hasChemicals = tenantHasModule(enabledModules, "chemicals");

  const [
    policyResult,
    riskResult,
    fireDrillResult,
    riddorResult,
    actionsResult,
    trainingResult,
    inspectionResult,
    auditResult,
    managementReviewResult,
    coshhResult,
    accidentBookResult,
    documentResult,
    orgChartResult,
  ] = await Promise.all([
    db
      .from("HmsHandbok")
      .select("id, status, lastReviewedAt")
      .eq("tenantId", tenantId)
      .eq("status", "PUBLISHED")
      .limit(1)
      .maybeSingle(),

    db
      .from("Risk")
      .select("id, nextReviewDate")
      .eq("tenantId", tenantId),

    db
      .from("FireDrill")
      .select("id, completedAt")
      .eq("tenantId", tenantId)
      .eq("status", "COMPLETED")
      .gte("completedAt", twelveMonthsAgo)
      .limit(1),

    db
      .from("Incident")
      .select("id, riddorDeadline, riddorReportedAt")
      .eq("tenantId", tenantId)
      .eq("riddorReportable", true)
      .is("riddorReportedAt", null)
      .lt("riddorDeadline", now.toISOString()),

    db
      .from("Measure")
      .select("id")
      .eq("tenantId", tenantId)
      .neq("status", "DONE")
      .lt("dueAt", now.toISOString()),

    db
      .from("Training")
      .select("id")
      .eq("tenantId", tenantId)
      .eq("mandatory", true)
      .lt("validUntil", now.toISOString())
      .not("validUntil", "is", null),

    db
      .from("Inspection")
      .select("id, completedAt")
      .eq("tenantId", tenantId)
      .eq("status", "COMPLETED")
      .gte("completedAt", sixMonthsAgo)
      .limit(1),

    db
      .from("Audit")
      .select("id, completedAt")
      .eq("tenantId", tenantId)
      .eq("status", "COMPLETED")
      .gte("completedAt", twelveMonthsAgo)
      .limit(1),

    db
      .from("ManagementReview")
      .select("id, completedAt")
      .eq("tenantId", tenantId)
      .gte("completedAt", twelveMonthsAgo)
      .limit(1),

    hasChemicals
      ? db
          .from("Chemical")
          .select("id, nextReviewDate")
          .eq("tenantId", tenantId)
      : Promise.resolve({ data: null }),

    db
      .from("Incident")
      .select("id, occurredAt")
      .eq("tenantId", tenantId)
      .lt("occurredAt", threeYearsAgo),

    db
      .from("Document")
      .select("id, nextReviewDate")
      .eq("tenantId", tenantId)
      .eq("status", "APPROVED")
      .lt("nextReviewDate", now.toISOString())
      .not("nextReviewDate", "is", null),

    db
      .from("OrgChartNode")
      .select("id, hsDutyKey, name")
      .eq("tenantId", tenantId),
  ]);

  const checks: ComplianceCheckResult[] = [];

  // 1. Health & safety policy — HSWA s.2(3)
  const hasPolicy = !!policyResult.data;
  const policyReviewed = hasPolicy && policyResult.data?.lastReviewedAt
    ? daysSince(policyResult.data.lastReviewedAt, now)! <= 365
    : false;
  checks.push({
    key: "policy",
    label: "Health and safety policy",
    legalRef: "HSWA 1974 s.2(3)",
    maxPoints: 10,
    earnedPoints: hasPolicy && policyReviewed ? 10 : hasPolicy ? 5 : 0,
    status: hasPolicy && policyReviewed ? "pass" : hasPolicy ? "attention" : "fail",
    detail: !hasPolicy
      ? "No published policy found."
      : !policyReviewed
        ? "Policy exists but review is overdue (annual review expected)."
        : "Policy published and reviewed within 12 months.",
  });

  // 2. Risk assessments — MHSWR reg.3
  const risks = riskResult.data ?? [];
  const overdueRiskReviews = risks.filter(
    (r: any) => r.nextReviewDate && new Date(r.nextReviewDate) < now,
  ).length;
  const hasRisks = risks.length > 0;
  const risksUpToDate = hasRisks && overdueRiskReviews === 0;
  checks.push({
    key: "risks",
    label: "Risk assessments reviewed within 12 months",
    legalRef: "MHSWR 1999 reg.3",
    maxPoints: 15,
    earnedPoints: risksUpToDate ? 15 : hasRisks ? 7 : 0,
    status: risksUpToDate ? "pass" : hasRisks ? "attention" : "fail",
    detail: !hasRisks
      ? "No risk assessments recorded."
      : overdueRiskReviews > 0
        ? `${overdueRiskReviews} assessment(s) overdue for review.`
        : "All risk assessments are current.",
  });

  // 3. Fire drill — Fire Safety Order 2005
  const hasRecentDrill = (fireDrillResult.data?.length ?? 0) > 0;
  checks.push({
    key: "fireDrill",
    label: "Fire drill conducted within 12 months",
    legalRef: "Regulatory Reform (Fire Safety) Order 2005",
    maxPoints: 5,
    earnedPoints: hasRecentDrill ? 5 : 0,
    status: hasRecentDrill ? "pass" : "fail",
    detail: hasRecentDrill
      ? "A completed fire drill is on record within the last 12 months."
      : "No fire drill completed in the last 12 months.",
  });

  // 4. No overdue RIDDOR reports — RIDDOR 2013
  const overdueRiddor = riddorResult.data?.length ?? 0;
  checks.push({
    key: "riddor",
    label: "No overdue RIDDOR reports",
    legalRef: "RIDDOR 2013",
    maxPoints: 10,
    earnedPoints: overdueRiddor === 0 ? 10 : 0,
    status: overdueRiddor === 0 ? "pass" : "fail",
    detail: overdueRiddor === 0
      ? "No overdue RIDDOR notifications."
      : `${overdueRiddor} RIDDOR report(s) past their deadline.`,
  });

  // 5. Actions not overdue — MHSWR
  const overdueActions = actionsResult.data?.length ?? 0;
  checks.push({
    key: "actions",
    label: "All actions closed or not overdue",
    legalRef: "MHSWR 1999",
    maxPoints: 10,
    earnedPoints: overdueActions === 0 ? 10 : overdueActions <= 3 ? 5 : 0,
    status: overdueActions === 0 ? "pass" : overdueActions <= 3 ? "attention" : "fail",
    detail: overdueActions === 0
      ? "No overdue corrective actions."
      : `${overdueActions} action(s) past their due date.`,
  });

  // 6. Training — HSWA s.2(2)(c)
  const expiredTraining = trainingResult.data?.length ?? 0;
  checks.push({
    key: "training",
    label: "No expired mandatory training",
    legalRef: "HSWA 1974 s.2(2)(c)",
    maxPoints: 10,
    earnedPoints: expiredTraining === 0 ? 10 : expiredTraining <= 2 ? 5 : 0,
    status: expiredTraining === 0 ? "pass" : expiredTraining <= 2 ? "attention" : "fail",
    detail: expiredTraining === 0
      ? "All mandatory training is current."
      : `${expiredTraining} mandatory training record(s) have expired.`,
  });

  // 7. Workplace inspection — MHSWR
  const hasRecentInspection = (inspectionResult.data?.length ?? 0) > 0;
  checks.push({
    key: "inspection",
    label: "Workplace inspection within 6 months",
    legalRef: "MHSWR 1999",
    maxPoints: 10,
    earnedPoints: hasRecentInspection ? 10 : 0,
    status: hasRecentInspection ? "pass" : "fail",
    detail: hasRecentInspection
      ? "A completed workplace inspection is on record within the last 6 months."
      : "No workplace inspection completed in the last 6 months.",
  });

  // 8. Internal audit — ISO 45001 cl.9.2
  const hasRecentAudit = (auditResult.data?.length ?? 0) > 0;
  checks.push({
    key: "audit",
    label: "Internal audit within 12 months",
    legalRef: "ISO 45001 cl.9.2",
    maxPoints: 5,
    earnedPoints: hasRecentAudit ? 5 : 0,
    status: hasRecentAudit ? "pass" : "fail",
    detail: hasRecentAudit
      ? "A completed internal audit is on record within 12 months."
      : "No internal audit completed in the last 12 months.",
  });

  // 9. Management review — ISO 45001 cl.9.3
  const hasManagementReview = (managementReviewResult.data?.length ?? 0) > 0;
  checks.push({
    key: "managementReview",
    label: "Management review within 12 months",
    legalRef: "ISO 45001 cl.9.3",
    maxPoints: 5,
    earnedPoints: hasManagementReview ? 5 : 0,
    status: hasManagementReview ? "pass" : "fail",
    detail: hasManagementReview
      ? "A management review has been completed within 12 months."
      : "No management review completed in the last 12 months.",
  });

  // 10. COSHH register — COSHH 2002 (only if chemicals module active)
  if (hasChemicals) {
    const chemicals = coshhResult.data ?? [];
    const hasCoshh = chemicals.length > 0;
    const overdueChemReviews = chemicals.filter(
      (c: any) => c.nextReviewDate && new Date(c.nextReviewDate) < now,
    ).length;
    checks.push({
      key: "coshh",
      label: "COSHH register up to date",
      legalRef: "COSHH 2002",
      maxPoints: 5,
      earnedPoints: hasCoshh && overdueChemReviews === 0 ? 5 : hasCoshh ? 2 : 0,
      status: hasCoshh && overdueChemReviews === 0 ? "pass" : hasCoshh ? "attention" : "fail",
      detail: !hasCoshh
        ? "No substances in the COSHH register."
        : overdueChemReviews > 0
          ? `${overdueChemReviews} COSHH assessment(s) overdue for review.`
          : "COSHH register is current.",
    });
  }

  // 11. Accident book entries — SSCPR 1979
  const staleEntries = accidentBookResult.data?.length ?? 0;
  checks.push({
    key: "accidentBook",
    label: "Accident book entries within retention period",
    legalRef: "SS(C&P)R 1979",
    maxPoints: 5,
    earnedPoints: staleEntries === 0 ? 5 : 0,
    status: staleEntries === 0 ? "pass" : "attention",
    detail: staleEntries === 0
      ? "No accident book entries older than 3 years requiring deletion."
      : `${staleEntries} entry/entries older than 3 years (review for data retention).`,
  });

  // 12. Document reviews — HSWA s.2
  const overdueDocReviews = documentResult.data?.length ?? 0;
  checks.push({
    key: "documentReviews",
    label: "Document reviews not overdue",
    legalRef: "HSWA 1974 s.2 arrangements",
    maxPoints: 5,
    earnedPoints: overdueDocReviews === 0 ? 5 : 0,
    status: overdueDocReviews === 0 ? "pass" : "attention",
    detail: overdueDocReviews === 0
      ? "All controlled documents are within their review date."
      : `${overdueDocReviews} document(s) overdue for review.`,
  });

  // 13. Organisation chart — HSWA s.2(3) Part 2
  const orgNodes = orgChartResult.data ?? [];
  const orgCoverage = assessOrgChartCoverage(orgNodes);
  const hasNamedDuties = orgCoverage.items.filter((item) => item.ok).length;
  checks.push({
    key: "orgChart",
    label: "Organisation of health and safety",
    legalRef: "HSWA 1974 s.2(3); MHSWR 1999 reg.7",
    maxPoints: 5,
    earnedPoints: orgCoverage.complete ? 5 : hasNamedDuties > 0 ? 3 : orgNodes.length > 0 ? 1 : 0,
    status: orgCoverage.complete ? "pass" : orgNodes.length > 0 ? "attention" : "fail",
    detail: orgCoverage.complete
      ? "Named MD, competent person, first aider and fire marshal."
      : orgCoverage.missing.length > 0
        ? `Missing named: ${orgCoverage.items.filter((item) => !item.ok).map((item) => item.label).join(", ")}.`
        : "No organisation chart. HSE requires names, positions and roles.",
  });

  const totalScore = checks.reduce((sum, c) => sum + c.earnedPoints, 0);
  const maxScore = checks.reduce((sum, c) => sum + c.maxPoints, 0);

  return {
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    checks,
    calculatedAt: now,
  };
}
