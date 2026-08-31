/**
 * Live HSEQ data for the digital safety board.
 * Public screens show status, counts and titles — not personal incident content.
 * CDM 2015: bring site information to people on site (regs 12 and 13).
 */

import { getAdminDb } from "@/lib/supabase/admin";

const ANNUAL_PLAN_STEP_COUNT = 12;

export interface TavleSjaItem {
  id: string;
  title: string;
  workLocation: string;
  responsibleName: string;
  plannedDate: string;
}

export interface TavleVernerundeData {
  lastCompletedAt: string | null;
  nextPlannedAt: string | null;
  openFindings: number;
  completedLast12Months: number;
}

export interface TavleOpplaringData {
  totalRegistered: number;
  valid: number;
  expiringSoon: number;
  expired: number;
}

export interface TavleAarshjulData {
  year: number;
  completed: number;
  total: number;
}

export interface TavleKpiData {
  openIncidents: number;
  criticalIncidents: number;
  closedThisMonth: number;
  openMeasures: number;
  daysSinceLastIncident: number | null;
}

export interface TavleLiveData {
  sja: TavleSjaItem[];
  vernerunde: TavleVernerundeData | null;
  opplaring: TavleOpplaringData | null;
  aarshjul: TavleAarshjulData | null;
  kpi: TavleKpiData | null;
}

const EXPIRING_SOON_DAYS = 60;
const VERNERUNDE_TYPES = ["VERNERUNDE", "SIKKERHETSVANDRING"] as const;

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getTavleLiveData(params: {
  tenantId: string;
  projectId: string | null;
  sectionTypes: ReadonlyArray<string>;
}): Promise<TavleLiveData> {
  const { tenantId, projectId, sectionTypes } = params;
  const needed = new Set(sectionTypes);
  const empty: TavleLiveData = {
    sja: [],
    vernerunde: null,
    opplaring: null,
    aarshjul: null,
    kpi: null,
  };

  const now = new Date();

  const [sja, vernerunde, opplaring, aarshjul, kpi] = await Promise.all([
    needed.has("SJA_AKTIVE") ? loadSja(tenantId, projectId) : Promise.resolve(empty.sja),
    needed.has("VERNERUNDE_STATUS")
      ? loadInspections(tenantId, projectId, now)
      : Promise.resolve(null),
    needed.has("OPPLARING_STATUS") ? loadTraining(tenantId, now) : Promise.resolve(null),
    needed.has("HMS_PLAN_AARSHJUL") ? loadAnnualPlan(tenantId, now) : Promise.resolve(null),
    needed.has("KPI_DASHBOARD") ? loadKpi(tenantId, projectId, now) : Promise.resolve(null),
  ]);

  return { sja, vernerunde, opplaring, aarshjul, kpi };
}

async function loadSja(tenantId: string, projectId: string | null): Promise<TavleSjaItem[]> {
  let query = getAdminDb()
    .from("SjaAnalysis")
    .select("id, title, workLocation, responsibleName, plannedDate")
    .eq("tenantId", tenantId)
    .eq("status", "ACTIVE")
    .order("plannedDate", { ascending: true })
    .limit(6);
  if (projectId) query = query.eq("projectId", projectId);
  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    workLocation: (row.workLocation as string) ?? "",
    responsibleName: (row.responsibleName as string) ?? "",
    plannedDate: toIso(row.plannedDate) ?? "",
  }));
}

async function loadInspections(
  tenantId: string,
  projectId: string | null,
  now: Date,
): Promise<TavleVernerundeData> {
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  let completedQuery = getAdminDb()
    .from("Inspection")
    .select("id, completedDate")
    .eq("tenantId", tenantId)
    .in("type", [...VERNERUNDE_TYPES])
    .eq("status", "COMPLETED")
    .order("completedDate", { ascending: false })
    .limit(1);
  if (projectId) completedQuery = completedQuery.eq("projectId", projectId);

  let nextQuery = getAdminDb()
    .from("Inspection")
    .select("scheduledDate")
    .eq("tenantId", tenantId)
    .in("type", [...VERNERUNDE_TYPES])
    .in("status", ["PLANNED", "IN_PROGRESS"])
    .gte("scheduledDate", now.toISOString())
    .order("scheduledDate", { ascending: true })
    .limit(1);
  if (projectId) nextQuery = nextQuery.eq("projectId", projectId);

  let yearQuery = getAdminDb()
    .from("Inspection")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .in("type", [...VERNERUNDE_TYPES])
    .eq("status", "COMPLETED")
    .gte("completedDate", twelveMonthsAgo.toISOString());
  if (projectId) yearQuery = yearQuery.eq("projectId", projectId);

  const [siste, neste, fullforte, idsRes] = await Promise.all([
    completedQuery.maybeSingle(),
    nextQuery.maybeSingle(),
    yearQuery,
    projectId
      ? getAdminDb()
          .from("Inspection")
          .select("id")
          .eq("tenantId", tenantId)
          .eq("projectId", projectId)
          .in("type", [...VERNERUNDE_TYPES])
      : getAdminDb()
          .from("Inspection")
          .select("id")
          .eq("tenantId", tenantId)
          .in("type", [...VERNERUNDE_TYPES]),
  ]);

  const inspectionIds = (idsRes.data ?? []).map((row) => row.id as string);
  let openFindings = 0;
  if (inspectionIds.length > 0) {
    const { count } = await getAdminDb()
      .from("InspectionFinding")
      .select("id", { count: "exact", head: true })
      .in("inspectionId", inspectionIds)
      .in("status", ["OPEN", "IN_PROGRESS"]);
    openFindings = count ?? 0;
  }

  return {
    lastCompletedAt: toIso(siste.data?.completedDate),
    nextPlannedAt: toIso(neste.data?.scheduledDate),
    openFindings,
    completedLast12Months: fullforte.count ?? 0,
  };
}

async function loadTraining(tenantId: string, now: Date): Promise<TavleOpplaringData> {
  const soon = new Date(now);
  soon.setDate(soon.getDate() + EXPIRING_SOON_DAYS);

  const [totalRes, expiredRes, expiringRes] = await Promise.all([
    getAdminDb()
      .from("Training")
      .select("id", { count: "exact", head: true })
      .eq("tenantId", tenantId)
      .not("completedAt", "is", null),
    getAdminDb()
      .from("Training")
      .select("id", { count: "exact", head: true })
      .eq("tenantId", tenantId)
      .not("completedAt", "is", null)
      .lt("validUntil", now.toISOString()),
    getAdminDb()
      .from("Training")
      .select("id", { count: "exact", head: true })
      .eq("tenantId", tenantId)
      .not("completedAt", "is", null)
      .gte("validUntil", now.toISOString())
      .lte("validUntil", soon.toISOString()),
  ]);

  const totalRegistered = totalRes.count ?? 0;
  const expired = expiredRes.count ?? 0;
  return {
    totalRegistered,
    valid: Math.max(totalRegistered - expired, 0),
    expiringSoon: expiringRes.count ?? 0,
    expired,
  };
}

async function loadAnnualPlan(tenantId: string, now: Date): Promise<TavleAarshjulData> {
  const year = now.getFullYear();
  const { count } = await getAdminDb()
    .from("HmsAnnualPlanCompletion")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .eq("year", year);
  return { year, completed: count ?? 0, total: ANNUAL_PLAN_STEP_COUNT };
}

async function loadKpi(
  tenantId: string,
  projectId: string | null,
  now: Date,
): Promise<TavleKpiData> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let openQ = getAdminDb()
    .from("Incident")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .neq("status", "CLOSED");
  let criticalQ = getAdminDb()
    .from("Incident")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .neq("status", "CLOSED")
    .gte("severity", 4);
  let closedQ = getAdminDb()
    .from("Incident")
    .select("id", { count: "exact", head: true })
    .eq("tenantId", tenantId)
    .eq("status", "CLOSED")
    .gte("closedAt", monthStart);
  let lastQ = getAdminDb()
    .from("Incident")
    .select("occurredAt")
    .eq("tenantId", tenantId)
    .order("occurredAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (projectId) {
    openQ = openQ.eq("projectId", projectId);
    criticalQ = criticalQ.eq("projectId", projectId);
    closedQ = closedQ.eq("projectId", projectId);
    lastQ = getAdminDb()
      .from("Incident")
      .select("occurredAt")
      .eq("tenantId", tenantId)
      .eq("projectId", projectId)
      .order("occurredAt", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  const [openIncidents, criticalIncidents, closedThisMonth, openMeasures, siste] = await Promise.all([
    openQ,
    criticalQ,
    closedQ,
    getAdminDb()
      .from("Measure")
      .select("id", { count: "exact", head: true })
      .eq("tenantId", tenantId)
      .neq("status", "DONE"),
    lastQ,
  ]);

  const lastDate = parseDate(siste.data?.occurredAt);
  const daysSinceLastIncident = lastDate
    ? Math.max(Math.floor((now.getTime() - lastDate.getTime()) / 86_400_000), 0)
    : null;

  return {
    openIncidents: openIncidents.count ?? 0,
    criticalIncidents: criticalIncidents.count ?? 0,
    closedThisMonth: closedThisMonth.count ?? 0,
    openMeasures: openMeasures.count ?? 0,
    daysSinceLastIncident,
  };
}
