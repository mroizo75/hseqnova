import type { EnterpriseAssuranceBand, EnterpriseDomainKey, EnterpriseVisibilityLevel } from "@prisma/client";
import { getAdminDb } from "@/lib/supabase/admin";
import type { EnterpriseContext } from "@/lib/enterprise-context";
import { accessLevel, canSeeDomainAggregates, canSeeDomainStatus } from "@/lib/enterprise-visibility";
import { overviewCounts } from "@/lib/enterprise-assurance";
import { compareToAverage, filterAnonymousRollups, periodKeys } from "@/lib/enterprise-stats";
import { getPreviousPeriod } from "@/features/intelligence/lib/metrics";

function scopedPortfolioFilter(ctx: EnterpriseContext, portfolioId?: string | null): string[] | null {
  if (portfolioId) {
    if (ctx.portfolioIds && !ctx.portfolioIds.includes(portfolioId)) return [];
    return [portfolioId];
  }
  return ctx.portfolioIds;
}

export type LatestCompanySnapshot = {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  industry: string | null;
  city: string | null;
  portfolioId: string;
  portfolioName: string;
  relationshipType: string;
  status: string;
  overallPercent: number | null;
  overallBand: EnterpriseAssuranceBand | null;
  trend: string | null;
  domainBands: Record<string, EnterpriseAssuranceBand>;
  activityAt: string | null;
  capturedAt: string | null;
  shareLossStatistics: boolean;
  access: Array<{ domainKey: EnterpriseDomainKey; visibilityLevel: EnterpriseVisibilityLevel }>;
};

export async function loadEnterpriseOverview(ctx: EnterpriseContext) {
  const companies = await loadEnterpriseCompanies(ctx, {});
  const counts = overviewCounts(
    companies
      .map((row) => row.overallBand)
      .filter((band): band is EnterpriseAssuranceBand => Boolean(band)),
  );
  const db = getAdminDb();
  let alertQuery = db
    .from("EnterpriseAlert")
    .select("id", { count: "exact", head: true })
    .eq("enterpriseId", ctx.enterpriseId)
    .is("acknowledgedAt", null);
  const { count: openAlerts } = await alertQuery;

  const { count: portfolioCount } = await db
    .from("EnterprisePortfolio")
    .select("id", { count: "exact", head: true })
    .eq("enterpriseId", ctx.enterpriseId);

  return {
    ...counts,
    companies: companies.length,
    openAlerts: openAlerts ?? 0,
    portfolioCount: portfolioCount ?? 0,
    companiesList: companies.slice(0, 8),
  };
}

export async function loadEnterpriseCompanies(
  ctx: EnterpriseContext,
  filters: {
    portfolioId?: string;
    band?: string;
    industry?: string;
    city?: string;
    q?: string;
  },
): Promise<LatestCompanySnapshot[]> {
  const db = getAdminDb();
  const portfolioIds = scopedPortfolioFilter(ctx, filters.portfolioId);
  let membershipQuery = db
    .from("EnterpriseMembership")
    .select(
      "id, tenantId, portfolioId, relationshipType, status, shareLossStatistics, portfolio:EnterprisePortfolio(id, name, enterpriseId)",
    )
    .in("status", ["ACTIVE", "PENDING", "INVITED"]);

  const { data: membershipRows } = await membershipQuery;
  const memberships = ((membershipRows ?? []) as Array<Record<string, unknown>>).filter((row) => {
    const portfolio = row.portfolio as { enterpriseId?: string; id?: string; name?: string } | null;
    if (portfolio?.enterpriseId !== ctx.enterpriseId) return false;
    if (portfolioIds && !portfolioIds.includes(row.portfolioId as string)) return false;
    return true;
  });

  const tenantIds = memberships.map((row) => row.tenantId as string);
  const membershipIds = memberships.map((row) => row.id as string);
  const { data: tenants } =
    tenantIds.length > 0
      ? await db.from("Tenant").select("id, name, industry, city").in("id", tenantIds)
      : { data: [] };
  const tenantById = new Map(
    ((tenants ?? []) as Array<{ id: string; name: string; industry: string | null; city: string | null }>).map(
      (row) => [row.id, row],
    ),
  );

  const { data: snapshots } =
    membershipIds.length > 0
      ? await db
          .from("EnterpriseAssuranceSnapshot")
          .select("membershipId, overallPercent, overallBand, domainBands, trend, activityAt, capturedAt")
          .in("membershipId", membershipIds)
          .order("capturedAt", { ascending: false })
      : { data: [] };

  const latestByMembership = new Map<string, Record<string, unknown>>();
  for (const snapshot of (snapshots ?? []) as Array<Record<string, unknown>>) {
    const id = snapshot.membershipId as string;
    if (!latestByMembership.has(id)) latestByMembership.set(id, snapshot);
  }

  const { data: accessRows } =
    membershipIds.length > 0
      ? await db
          .from("EnterpriseMembershipAccess")
          .select("membershipId, domainKey, visibilityLevel")
          .in("membershipId", membershipIds)
      : { data: [] };
  const accessByMembership = new Map<
    string,
    Array<{ domainKey: EnterpriseDomainKey; visibilityLevel: EnterpriseVisibilityLevel }>
  >();
  for (const row of (accessRows ?? []) as Array<{
    membershipId: string;
    domainKey: EnterpriseDomainKey;
    visibilityLevel: EnterpriseVisibilityLevel;
  }>) {
    const existing = accessByMembership.get(row.membershipId) ?? [];
    existing.push({ domainKey: row.domainKey, visibilityLevel: row.visibilityLevel });
    accessByMembership.set(row.membershipId, existing);
  }

  return memberships
    .map((row) => {
      const tenant = tenantById.get(row.tenantId as string);
      const snapshot = latestByMembership.get(row.id as string);
      const portfolio = row.portfolio as { id: string; name: string };
      return {
        membershipId: row.id as string,
        tenantId: row.tenantId as string,
        tenantName: tenant?.name ?? "Unknown company",
        industry: tenant?.industry ?? null,
        city: tenant?.city ?? null,
        portfolioId: row.portfolioId as string,
        portfolioName: portfolio?.name ?? "",
        relationshipType: row.relationshipType as string,
        status: row.status as string,
        overallPercent: snapshot ? Number(snapshot.overallPercent) : null,
        overallBand: (snapshot?.overallBand as EnterpriseAssuranceBand | undefined) ?? null,
        trend: (snapshot?.trend as string | undefined) ?? null,
        domainBands: (snapshot?.domainBands as Record<string, EnterpriseAssuranceBand>) ?? {},
        activityAt: (snapshot?.activityAt as string | null) ?? null,
        capturedAt: (snapshot?.capturedAt as string | null) ?? null,
        shareLossStatistics: Boolean(row.shareLossStatistics),
        access: accessByMembership.get(row.id as string) ?? [],
      };
    })
    .filter((row) => {
      if (filters.band && row.overallBand !== filters.band) return false;
      if (filters.industry && row.industry !== filters.industry) return false;
      if (filters.city && row.city !== filters.city) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!row.tenantName.toLowerCase().includes(q) && !(row.industry ?? "").toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
}

export async function loadCompanyAssurance(
  ctx: EnterpriseContext,
  tenantId: string,
): Promise<LatestCompanySnapshot | null> {
  const companies = await loadEnterpriseCompanies(ctx, {});
  return companies.find((row) => row.tenantId === tenantId) ?? null;
}

export function visibleDomainBands(company: LatestCompanySnapshot): Record<string, string> {
  const visible: Record<string, string> = {};
  for (const [domain, band] of Object.entries(company.domainBands)) {
    if (canSeeDomainStatus(company.access, domain as EnterpriseDomainKey)) {
      visible[domain] = band;
    }
  }
  return visible;
}

export async function loadEnterprisePortfolios(ctx: EnterpriseContext) {
  const db = getAdminDb();
  const { data } = await db
    .from("EnterprisePortfolio")
    .select("id, name, sector, region, standardId, createdAt")
    .eq("enterpriseId", ctx.enterpriseId)
    .order("name");
  const portfolios = (data ?? []) as Array<{
    id: string;
    name: string;
    sector: string | null;
    region: string | null;
    standardId: string | null;
  }>;
  const scoped = ctx.portfolioIds ? portfolios.filter((row) => ctx.portfolioIds?.includes(row.id)) : portfolios;
  const companies = await loadEnterpriseCompanies(ctx, {});
  return scoped.map((portfolio) => {
    const members = companies.filter((row) => row.portfolioId === portfolio.id);
    const counts = overviewCounts(
      members
        .map((row) => row.overallBand)
        .filter((band): band is EnterpriseAssuranceBand => Boolean(band)),
    );
    const percents = members
      .map((row) => row.overallPercent)
      .filter((value): value is number => value !== null);
    return {
      ...portfolio,
      ...counts,
      averageAssurance:
        percents.length > 0
          ? Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length)
          : null,
    };
  });
}

export async function loadEnterpriseAlerts(ctx: EnterpriseContext) {
  const db = getAdminDb();
  const { data } = await db
    .from("EnterpriseAlert")
    .select("id, type, severity, title, summary, countValue, membershipId, portfolioId, createdAt, acknowledgedAt")
    .eq("enterpriseId", ctx.enterpriseId)
    .order("createdAt", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function loadEnterpriseStandards(ctx: EnterpriseContext) {
  const db = getAdminDb();
  const { data: standards } = await db
    .from("EnterpriseStandard")
    .select("id, name, description, isDefault")
    .eq("enterpriseId", ctx.enterpriseId)
    .order("name");
  const ids = ((standards ?? []) as Array<{ id: string }>).map((row) => row.id);
  const { data: requirements } =
    ids.length > 0
      ? await db
          .from("EnterpriseStandardRequirement")
          .select("id, standardId, domainKey, ruleKey, threshold, label")
          .in("standardId", ids)
      : { data: [] };
  return {
    standards: standards ?? [],
    requirements: requirements ?? [],
  };
}

export async function loadEnterpriseAdvisors(ctx: EnterpriseContext) {
  const db = getAdminDb();
  const { data: assignments } = await db
    .from("EnterpriseAdvisorAssignment")
    .select("id, userId, scopeType, scopeId, canAssistInWorkspace, createdAt")
    .eq("enterpriseId", ctx.enterpriseId);
  const userIds = ((assignments ?? []) as Array<{ userId: string }>).map((row) => row.userId);
  const { data: users } =
    userIds.length > 0
      ? await db.from("User").select("id, name, email").in("id", userIds)
      : { data: [] };
  const byId = new Map(((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((row) => [row.id, row]));
  return ((assignments ?? []) as Array<{
    id: string;
    userId: string;
    scopeType: string;
    scopeId: string;
    canAssistInWorkspace: boolean;
    createdAt: string;
  }>).map((row) => ({
    ...row,
    user: byId.get(row.userId) ?? null,
  }));
}

export async function loadEnterpriseUsers(ctx: EnterpriseContext) {
  const db = getAdminDb();
  const { data: members } = await db
    .from("EnterpriseUser")
    .select("id, userId, role, createdAt")
    .eq("enterpriseId", ctx.enterpriseId);
  const userIds = ((members ?? []) as Array<{ userId: string }>).map((row) => row.userId);
  const { data: users } =
    userIds.length > 0
      ? await db.from("User").select("id, name, email").in("id", userIds)
      : { data: [] };
  const byId = new Map(((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((row) => [row.id, row]));
  return ((members ?? []) as Array<{ id: string; userId: string; role: string; createdAt: string }>).map((row) => ({
    id: row.id,
    userId: row.userId,
    role: row.role,
    createdAt: row.createdAt,
    user: byId.get(row.userId) ?? null,
  }));
}

export async function loadImprovementRequests(ctx: EnterpriseContext, membershipId?: string) {
  const db = getAdminDb();
  let query = db
    .from("EnterpriseImprovementRequest")
    .select("id, membershipId, title, message, status, createdAt")
    .order("createdAt", { ascending: false });
  if (membershipId) query = query.eq("membershipId", membershipId);
  const { data: requests } = await query.limit(100);
  const ids = ((requests ?? []) as Array<{ id: string }>).map((row) => row.id);
  const { data: measures } =
    ids.length > 0
      ? await db.from("Measure").select("id, status, enterpriseImprovementRequestId").in("enterpriseImprovementRequestId", ids)
      : { data: [] };
  return ((requests ?? []) as Array<{
    id: string;
    membershipId: string;
    title: string;
    message: string;
    status: string;
    createdAt: string;
  }>).map((request) => {
    const linked = ((measures ?? []) as Array<{ enterpriseImprovementRequestId: string; status: string }>).filter(
      (row) => row.enterpriseImprovementRequestId === request.id,
    );
    return {
      ...request,
      actionTotal: linked.length,
      actionDone: linked.filter((row) => row.status === "DONE").length,
      actionOpen: linked.filter((row) => row.status !== "DONE").length,
    };
  });
}

export async function loadAnalytics(
  ctx: EnterpriseContext,
  filters: {
    period?: string;
    dimension?: string;
    portfolioId?: string;
    industry?: string;
    city?: string;
    sizeBand?: string;
  },
) {
  if (!ctx.analyticsEnabled) {
    throw { code: "FORBIDDEN", message: "Portfolio Analytics is not enabled for this organisation" };
  }
  const db = getAdminDb();
  const period = filters.period || periodKeys(new Date()).monthly;
  const previousPeriod = getPreviousPeriod(period);
  const dimension = filters.dimension ?? "industry";
  const { data } = await db
    .from("EnterpriseStatRollup")
    .select("*")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", dimension)
    .eq("period", period)
    .limit(50);
  const { data: previousRollups } = await db
    .from("EnterpriseStatRollup")
    .select("*")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", dimension)
    .eq("period", previousPeriod)
    .limit(50);
  const { data: bookRollup } = await db
    .from("EnterpriseStatRollup")
    .select("avgTrir, avgLtir, incidentTotal, riddorCount, companyCount")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", "all")
    .eq("dimensionValue", "all")
    .eq("period", period)
    .maybeSingle();
  const { data: previousBook } = await db
    .from("EnterpriseStatRollup")
    .select("avgTrir, avgLtir, incidentTotal")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", "all")
    .eq("dimensionValue", "all")
    .eq("period", previousPeriod)
    .maybeSingle();

  const companies = await loadEnterpriseCompanies(ctx, {
    portfolioId: filters.portfolioId,
    industry: filters.industry,
    city: filters.city,
  });
  const named = companies.filter(
    (row) => row.shareLossStatistics && canSeeDomainAggregates(row.access, "INCIDENT_STATS"),
  );

  const membershipIds = named.map((row) => row.membershipId);
  const { data: snapshots } =
    membershipIds.length > 0
      ? await db
          .from("EnterpriseStatSnapshot")
          .select(
            "membershipId, incidentTotal, nearMissCount, accidentCount, riddorCount, lostTimeCount, fatalCount, trir, ltir, period, sizeBand, industry, city",
          )
          .in("membershipId", membershipIds)
          .in("period", [period, previousPeriod])
      : { data: [] };

  const currentByMembership = new Map<string, Record<string, unknown>>();
  const previousByMembership = new Map<string, Record<string, unknown>>();
  for (const snapshot of (snapshots ?? []) as Array<Record<string, unknown>>) {
    const map = snapshot.period === period ? currentByMembership : previousByMembership;
    if (!map.has(snapshot.membershipId as string)) map.set(snapshot.membershipId as string, snapshot);
  }

  const bookAvgTrir = bookRollup?.avgTrir != null ? Number(bookRollup.avgTrir) : null;
  const previousAvgTrir = previousBook?.avgTrir != null ? Number(previousBook.avgTrir) : null;

  return {
    period,
    previousPeriod,
    dimension,
    book: {
      companyCount: bookRollup ? Number(bookRollup.companyCount) : 0,
      incidentTotal: bookRollup ? Number(bookRollup.incidentTotal) : 0,
      riddorCount: bookRollup ? Number(bookRollup.riddorCount) : 0,
      avgTrir: bookAvgTrir,
      avgLtir: bookRollup?.avgLtir != null ? Number(bookRollup.avgLtir) : null,
      vsPrevious: compareToAverage(bookAvgTrir, previousAvgTrir),
    },
    rollups: ((data ?? []) as Array<Record<string, unknown>>).filter((row) => {
      if (filters.sizeBand && dimension === "sizeBand" && row.dimensionValue !== filters.sizeBand) return false;
      return true;
    }),
    previousRollups: previousRollups ?? [],
    companies: named
      .map((row) => {
        const stats = currentByMembership.get(row.membershipId) ?? null;
        if (filters.sizeBand && stats && String(stats.sizeBand ?? "") !== filters.sizeBand) return null;
        const previous = previousByMembership.get(row.membershipId) ?? null;
        const trir = stats?.trir != null ? Number(stats.trir) : null;
        return {
          tenantName: row.tenantName,
          industry: row.industry,
          city: row.city,
          membershipId: row.membershipId,
          stats,
          vsBook: compareToAverage(trir, bookAvgTrir),
          vsPrevious: compareToAverage(trir, previous?.trir != null ? Number(previous.trir) : null),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null),
  };
}

export async function loadBenchmark(ctx: EnterpriseContext) {
  if (!ctx.benchmarkEnabled) {
    throw { code: "FORBIDDEN", message: "Risk Intelligence is not enabled for this organisation" };
  }
  const db = getAdminDb();
  const period = periodKeys(new Date()).monthly;
  const { data: industry } = await db
    .from("EnterpriseStatRollup")
    .select("*")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", "industry")
    .eq("period", period);
  const { data: region } = await db
    .from("EnterpriseStatRollup")
    .select("*")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", "region")
    .eq("period", period);
  const { data: book } = await db
    .from("EnterpriseStatRollup")
    .select("*")
    .eq("enterpriseId", ctx.enterpriseId)
    .eq("dimension", "all")
    .eq("dimensionValue", "all")
    .eq("period", period)
    .maybeSingle();
  const bookAvgTrir = book?.avgTrir != null ? Number(book.avgTrir) : null;
  const bookAvgLtir = book?.avgLtir != null ? Number(book.avgLtir) : null;
  return {
    period,
    book: book
      ? {
          companyCount: Number(book.companyCount),
          incidentTotal: Number(book.incidentTotal),
          riddorCount: Number(book.riddorCount),
          avgTrir: bookAvgTrir,
          avgLtir: bookAvgLtir,
        }
      : null,
    industries: filterAnonymousRollups((industry ?? []) as Array<{ companyCount: number }>).map((row) => ({
      ...row,
      vsBookTrir: compareToAverage((row as { avgTrir?: number | null }).avgTrir ?? null, bookAvgTrir),
      vsBookLtir: compareToAverage((row as { avgLtir?: number | null }).avgLtir ?? null, bookAvgLtir),
    })),
    regions: filterAnonymousRollups((region ?? []) as Array<{ companyCount: number }>),
  };
}

export async function loadConnectedOrganisations(tenantId: string) {
  const db = getAdminDb();
  const { data: memberships } = await db
    .from("EnterpriseMembership")
    .select(
      "id, status, relationshipType, shareLossStatistics, requiresCompanyConsent, portfolioId, portfolio:EnterprisePortfolio(name, enterpriseId, enterprise:EnterpriseOrganisation(id, name, programmeName, type))",
    )
    .eq("tenantId", tenantId);
  const ids = ((memberships ?? []) as Array<{ id: string }>).map((row) => row.id);
  const { data: access } =
    ids.length > 0
      ? await db
          .from("EnterpriseMembershipAccess")
          .select("membershipId, domainKey, visibilityLevel")
          .in("membershipId", ids)
      : { data: [] };
  const { data: shares } =
    ids.length > 0
      ? await db.from("EnterpriseEvidenceShare").select("id, membershipId, documentId").in("membershipId", ids)
      : { data: [] };
  const { data: requests } =
    ids.length > 0
      ? await db
          .from("EnterpriseImprovementRequest")
          .select("id, membershipId, title, message, status")
          .in("membershipId", ids)
          .in("status", ["REQUESTED", "ACCEPTED", "IN_PROGRESS"])
      : { data: [] };
  return { memberships: memberships ?? [], access: access ?? [], shares: shares ?? [], requests: requests ?? [] };
}

export async function loadTenantDocumentsForShare(tenantId: string) {
  const { data } = await getAdminDb()
    .from("Document")
    .select("id, title, status")
    .eq("tenantId", tenantId)
    .eq("status", "APPROVED")
    .order("title")
    .limit(100);
  return data ?? [];
}

export { accessLevel };
