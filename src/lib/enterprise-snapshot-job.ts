import { createId } from "@/lib/ids";
import { getAdminDb } from "@/lib/supabase/admin";
import { evaluateHseqStatus, type HseqDutyKey } from "@/lib/hseq-status";
import { loadEnabledModuleKeys, loadHseqStatusInput } from "@/server/queries/hseq-status.queries";
import { loadIsoReadiness } from "@/server/queries/iso.queries";
import { tenantHasIsoPack } from "@/lib/tenant-modules";
import {
  evaluateAssurance,
  trendFromPercents,
  type StandardRequirementInput,
} from "@/lib/enterprise-assurance";
import {
  countIncidents,
  periodKeys,
  rollupStats,
  sizeBandFromEmployeeCount,
  type IncidentCountInput,
} from "@/lib/enterprise-stats";

const ALL_DUTY_KEYS: HseqDutyKey[] = [
  "policy",
  "risks",
  "incidents",
  "actions",
  "inspections",
  "fireDrills",
  "training",
  "documents",
  "sja",
  "chemicals",
  "exposureRegister",
  "constructionCompliance",
  "audits",
  "environment",
];

const BATCH_SIZE = 200;

type MembershipRow = {
  id: string;
  portfolioId: string;
  tenantId: string;
  relationshipType: string;
  shareLossStatistics: boolean;
  status: string;
};

type PortfolioRow = {
  id: string;
  enterpriseId: string;
  standardId: string | null;
};

export async function runEnterpriseSnapshots(now = new Date()): Promise<{
  memberships: number;
  snapshots: number;
  alerts: number;
}> {
  const db = getAdminDb();
  const { data: memberships } = await db
    .from("EnterpriseMembership")
    .select("id, portfolioId, tenantId, relationshipType, shareLossStatistics, status")
    .eq("status", "ACTIVE");

  const rows = (memberships ?? []) as MembershipRow[];
  let snapshots = 0;
  let alerts = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (const membership of batch) {
      const result = await snapshotMembership(membership, now);
      snapshots += 1;
      alerts += result.alerts;
    }
  }

  await rebuildRollups(now);
  return { memberships: rows.length, snapshots, alerts };
}

async function snapshotMembership(membership: MembershipRow, now: Date): Promise<{ alerts: number }> {
  const db = getAdminDb();
  const { data: portfolio } = await db
    .from("EnterprisePortfolio")
    .select("id, enterpriseId, standardId")
    .eq("id", membership.portfolioId)
    .maybeSingle();
  if (!portfolio) return { alerts: 0 };
  const portfolioRow = portfolio as PortfolioRow;

  const enabledModules = await loadEnabledModuleKeys(membership.tenantId);
  const input = await loadHseqStatusInput({
    tenantId: membership.tenantId,
    now,
    enabledModules,
    allowedKeys: ALL_DUTY_KEYS,
  });
  const report = evaluateHseqStatus(input);

  let iso45001Percent: number | null = null;
  let iso9001Percent: number | null = null;
  if (tenantHasIsoPack(enabledModules)) {
    try {
      const iso = await loadIsoReadiness(membership.tenantId, enabledModules);
      iso45001Percent = iso.readiness.percent;
      iso9001Percent = iso.readiness.percent;
    } catch {
      iso45001Percent = null;
    }
  }

  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const { data: reviews } = await db
    .from("ManagementReview")
    .select("id, status, createdAt")
    .eq("tenantId", membership.tenantId)
    .in("status", ["COMPLETED", "APPROVED"])
    .gte("createdAt", yearAgo.toISOString())
    .limit(1);
  const managementReviewCurrent = ((reviews ?? []) as unknown[]).length > 0;

  const requirements = await loadRequirements(portfolioRow.standardId);
  const assurance = evaluateAssurance({
    report,
    iso45001Percent,
    iso9001Percent,
    managementReviewCurrent,
    requirements,
  });

  const { data: previous } = await db
    .from("EnterpriseAssuranceSnapshot")
    .select("overallPercent")
    .eq("membershipId", membership.id)
    .order("capturedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  const trend = trendFromPercents(
    previous ? Number((previous as { overallPercent: number }).overallPercent) : null,
    assurance.overallPercent,
  );

  const { data: tenant } = await db
    .from("Tenant")
    .select("industry, city, employeeCount, updatedAt")
    .eq("id", membership.tenantId)
    .maybeSingle();

  await db.from("EnterpriseAssuranceSnapshot").insert({
    id: createId(),
    membershipId: membership.id,
    portfolioId: membership.portfolioId,
    enterpriseId: portfolioRow.enterpriseId,
    standardId: portfolioRow.standardId,
    overallPercent: assurance.overallPercent,
    overallBand: assurance.overallBand,
    domainBands: assurance.domainBands,
    activityAt: (tenant as { updatedAt?: string } | null)?.updatedAt ?? now.toISOString(),
    trend,
    capturedAt: now.toISOString(),
  });

  const period = periodKeys(now);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const { data: incidents } = await db
    .from("Incident")
    .select(
      "type, status, isFatal, isLostTimeIncident, lostWorkdays, isFirstAidCase, specifiedInjury, overSevenDayInjury, riddorReportable, estimatedDamageCost, severity, createdAt, closedAt",
    )
    .eq("tenantId", membership.tenantId)
    .gte("createdAt", monthStart.toISOString());

  const counters = countIncidents(
    ((incidents ?? []) as IncidentCountInput[]).map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      closedAt: row.closedAt ? new Date(row.closedAt) : null,
    })),
    Number((tenant as { employeeCount?: number } | null)?.employeeCount ?? 0),
  );

  await db.from("EnterpriseStatSnapshot").upsert(
    {
      id: createId(),
      membershipId: membership.id,
      portfolioId: membership.portfolioId,
      enterpriseId: portfolioRow.enterpriseId,
      period: period.monthly,
      periodType: "MONTHLY",
      industry: (tenant as { industry?: string } | null)?.industry ?? null,
      city: (tenant as { city?: string } | null)?.city ?? null,
      region: (tenant as { city?: string } | null)?.city ?? null,
      sizeBand: sizeBandFromEmployeeCount((tenant as { employeeCount?: number } | null)?.employeeCount),
      relationshipType: membership.relationshipType,
      incidentTotal: counters.incidentTotal,
      incidentOpen: counters.incidentOpen,
      nearMissCount: counters.nearMissCount,
      accidentCount: counters.accidentCount,
      fatalCount: counters.fatalCount,
      lostTimeCount: counters.lostTimeCount,
      riddorCount: counters.riddorCount,
      firstAidCount: counters.firstAidCount,
      specifiedInjuryCount: counters.specifiedInjuryCount,
      overSevenDayCount: counters.overSevenDayCount,
      lostWorkdays: counters.lostWorkdays,
      estimatedDamageCost: counters.estimatedDamageCost,
      trir: counters.trir,
      ltir: counters.ltir,
      avgMttrDays: counters.avgMttrDays,
      byType: counters.byType,
      bySeverity: counters.bySeverity,
      capturedAt: now.toISOString(),
    },
    { onConflict: "membershipId,period,periodType" },
  );

  let alerts = 0;
  if (assurance.overallBand === "RED") {
    await insertAlertOnce({
      enterpriseId: portfolioRow.enterpriseId,
      portfolioId: membership.portfolioId,
      membershipId: membership.id,
      type: "CRITICAL_ASSURANCE",
      severity: "CRITICAL",
      title: "Company requires critical attention",
      summary: `HSEQ Assurance is ${assurance.overallPercent}%.`,
    });
    alerts += 1;
  }
  const overdueActions = input.actions.overdueCount;
  if (overdueActions > 0) {
    await insertAlertOnce({
      enterpriseId: portfolioRow.enterpriseId,
      portfolioId: membership.portfolioId,
      membershipId: membership.id,
      type: "OVERDUE_ACTIONS",
      severity: overdueActions >= 5 ? "CRITICAL" : "WARNING",
      title: "Overdue actions",
      summary: `${overdueActions} overdue corrective actions.`,
      countValue: overdueActions,
    });
    alerts += 1;
  }
  return { alerts };
}

async function loadRequirements(standardId: string | null): Promise<StandardRequirementInput[]> {
  if (!standardId) return [];
  const { data } = await getAdminDb()
    .from("EnterpriseStandardRequirement")
    .select("domainKey, ruleKey, threshold")
    .eq("standardId", standardId);
  return ((data ?? []) as StandardRequirementInput[]) ?? [];
}

async function insertAlertOnce(input: {
  enterpriseId: string;
  portfolioId: string;
  membershipId: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  summary: string;
  countValue?: number;
}): Promise<void> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const db = getAdminDb();
  const { data: existing } = await db
    .from("EnterpriseAlert")
    .select("id")
    .eq("membershipId", input.membershipId)
    .eq("type", input.type)
    .is("acknowledgedAt", null)
    .gte("createdAt", dayAgo)
    .limit(1);
  if ((existing ?? []).length > 0) return;
  await db.from("EnterpriseAlert").insert({
    id: createId(),
    ...input,
    createdAt: new Date().toISOString(),
  });
}

async function rebuildRollups(now: Date): Promise<void> {
  const db = getAdminDb();
  const period = periodKeys(now);
  const { data: snapshots } = await db
    .from("EnterpriseStatSnapshot")
    .select(
      "membershipId, enterpriseId, portfolioId, industry, city, sizeBand, incidentTotal, nearMissCount, accidentCount, fatalCount, lostTimeCount, riddorCount, trir, ltir",
    )
    .eq("period", period.monthly)
    .eq("periodType", "MONTHLY");

  const snapshotRows = (snapshots ?? []) as Array<{
    membershipId: string;
    enterpriseId: string;
    portfolioId: string;
    industry: string | null;
    city: string | null;
    sizeBand: string | null;
    incidentTotal: number;
    nearMissCount: number;
    accidentCount: number;
    fatalCount: number;
    lostTimeCount: number;
    riddorCount: number;
    trir: number | null;
    ltir: number | null;
  }>;

  const membershipIds = [...new Set(snapshotRows.map((row) => row.membershipId))];
  const { data: memberships } =
    membershipIds.length > 0
      ? await db
          .from("EnterpriseMembership")
          .select("id, tenantId, shareLossStatistics")
          .in("id", membershipIds)
      : { data: [] };
  const consenting = new Set(
    ((memberships ?? []) as Array<{ id: string; shareLossStatistics: boolean }>)
      .filter((row) => row.shareLossStatistics)
      .map((row) => row.id),
  );
  const tenantIds = [
    ...new Set(
      ((memberships ?? []) as Array<{ tenantId: string; shareLossStatistics: boolean }>)
        .filter((row) => row.shareLossStatistics)
        .map((row) => row.tenantId),
    ),
  ];
  const { data: consents } =
    tenantIds.length > 0
      ? await db.from("IntelligenceConsent").select("tenantId, optedIn").in("tenantId", tenantIds)
      : { data: [] };
  const optedOut = new Set(
    ((consents ?? []) as Array<{ tenantId: string; optedIn: boolean }>)
      .filter((row) => row.optedIn === false)
      .map((row) => row.tenantId),
  );
  const tenantByMembership = new Map(
    ((memberships ?? []) as Array<{ id: string; tenantId: string }>).map((row) => [row.id, row.tenantId]),
  );

  const rows = snapshotRows.filter((row) => {
    if (!consenting.has(row.membershipId)) return false;
    const tenantId = tenantByMembership.get(row.membershipId);
    if (tenantId && optedOut.has(tenantId)) return false;
    return true;
  });

  const byEnterprise = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = byEnterprise.get(row.enterpriseId) ?? [];
    existing.push(row);
    byEnterprise.set(row.enterpriseId, existing);
  }

  for (const [enterpriseId, group] of byEnterprise) {
    const dimensions: Array<{ name: string; pick: (row: (typeof rows)[number]) => string }> = [
      { name: "all", pick: () => "all" },
      { name: "industry", pick: (row) => row.industry || "unknown" },
      { name: "region", pick: (row) => row.city || "unknown" },
      { name: "sizeBand", pick: (row) => row.sizeBand || "unknown" },
      { name: "portfolio", pick: (row) => row.portfolioId },
    ];
    for (const dimension of dimensions) {
      const rolled = rollupStats(
        group.map((row) => ({
          dimensionValue: dimension.pick(row),
          incidentTotal: row.incidentTotal,
          nearMissCount: row.nearMissCount,
          accidentCount: row.accidentCount,
          fatalCount: row.fatalCount,
          lostTimeCount: row.lostTimeCount,
          riddorCount: row.riddorCount,
          trir: row.trir,
          ltir: row.ltir,
        })),
        dimension.name,
      );
      for (const item of rolled) {
        await db.from("EnterpriseStatRollup").upsert(
          {
            id: createId(),
            enterpriseId,
            portfolioId: dimension.name === "portfolio" ? item.dimensionValue : null,
            dimension: item.dimension,
            dimensionValue: item.dimensionValue,
            period: period.monthly,
            periodType: "MONTHLY",
            companyCount: item.companyCount,
            incidentTotal: item.incidentTotal,
            nearMissCount: item.nearMissCount,
            accidentCount: item.accidentCount,
            fatalCount: item.fatalCount,
            lostTimeCount: item.lostTimeCount,
            riddorCount: item.riddorCount,
            avgTrir: item.avgTrir,
            avgLtir: item.avgLtir,
            metrics: {},
            capturedAt: now.toISOString(),
          },
          { onConflict: "enterpriseId,portfolioId,dimension,dimensionValue,period,periodType" },
        );
      }
    }
  }
}
