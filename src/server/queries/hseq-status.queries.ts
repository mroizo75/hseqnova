import { getAdminDb } from "@/lib/supabase/admin";
import { tenantHasModule } from "@/lib/tenant-modules";
import type { HseqDutyKey, HseqStatusInput } from "@/lib/hseq-status";
import type { RolePermissions } from "@/lib/permissions";

const OPEN_INCIDENT = new Set(["OPEN", "INVESTIGATING"]);
const CLOSED_RISK = "CLOSED";
const DONE_ACTION = "DONE";
const CLOSED_INSPECTION = new Set(["COMPLETED", "CANCELLED"]);
const CLOSED_AUDIT = new Set(["COMPLETED", "APPROVED", "CANCELLED"]);
const COMPLETED_DRILL = new Set(["COMPLETED", "EVALUATED"]);
const APPROVED_POLICY = "APPROVED";

export function allowedHseqDutyKeys(permissions: RolePermissions): HseqDutyKey[] {
  const keys: HseqDutyKey[] = [];
  if (permissions.canReadDocuments || permissions.canReadRoutines) keys.push("policy");
  if (permissions.canReadRisks) keys.push("risks");
  if (permissions.canReadIncidents || permissions.canCreateIncidents) keys.push("incidents");
  if (permissions.canReadActions) keys.push("actions");
  if (permissions.canReadInspections) {
    keys.push("inspections");
    keys.push("fireDrills");
  }
  if (permissions.canReadOwnTraining || permissions.canReadAllTraining) keys.push("training");
  if (permissions.canReadDocuments) keys.push("documents");
  if (permissions.canReadSja || permissions.canCreateSja) keys.push("sja");
  if (permissions.canReadChemicals) keys.push("chemicals");
  if (permissions.canReadExposureRegister) keys.push("exposureRegister");
  if (permissions.canReadConstructionCompliance) keys.push("constructionCompliance");
  if (permissions.canReadAudits) keys.push("audits");
  if (permissions.canReadEnvironment) keys.push("environment");
  return keys;
}

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function loadEnabledModuleKeys(tenantId: string): Promise<string[]> {
  const { data } = await getAdminDb()
    .from("TenantModule")
    .select("moduleKey")
    .eq("tenantId", tenantId)
    .in("status", ["ACTIVE", "TRIAL"]);
  return ((data ?? []) as Array<{ moduleKey: string }>).map((row) => row.moduleKey);
}

export async function loadHseqStatusInput(opts: {
  tenantId: string;
  now: Date;
  enabledModules: string[];
  allowedKeys: HseqDutyKey[];
}): Promise<HseqStatusInput> {
  const { tenantId, now, enabledModules, allowedKeys } = opts;
  const allowed = new Set(allowedKeys);
  const db = getAdminDb();
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const include = (key: HseqDutyKey, moduleKey: string) =>
    allowed.has(key) && tenantHasModule(enabledModules, moduleKey);

  const [
    handbookRes,
    risksRes,
    incidentsRes,
    measuresRes,
    inspectionsRes,
    drillsRes,
    fraRes,
    trainingsRes,
    documentsRes,
    sjaRes,
    chemicalsRes,
    exposureRes,
    projectsRes,
    cppRes,
    auditsRes,
    environmentRes,
  ] = await Promise.all([
    include("policy", "hmsHandbok")
      ? db
          .from("HmsHandbook")
          .select("id, lastReviewedAt, currentVersionId")
          .eq("tenantId", tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    include("risks", "risks")
      ? db.from("Risk").select("score, status, nextReviewDate").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("incidents", "incidents")
      ? db
          .from("Incident")
          .select("status, riddorReportable, riddorReportedAt, riddorDueAt")
          .eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("actions", "actions")
      ? db.from("Measure").select("status, dueAt").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("inspections", "inspections")
      ? db.from("Inspection").select("status, scheduledDate").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("fireDrills", "fireDrills")
      ? db.from("FireDrill").select("status, completedAt").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("fireDrills", "fireDrills")
      ? db.from("FireRiskAssessment").select("status, reviewDate").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("training", "training")
      ? db.from("Training").select("completedAt, validUntil").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("documents", "documents")
      ? db.from("Document").select("id").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("sja", "sja")
      ? db.from("SjaAnalysis").select("id").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("chemicals", "chemicals")
      ? db.from("Chemical").select("sdsKey, nextReviewDate").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("exposureRegister", "chemicals")
      ? db.from("ExposureRegister").select("id").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("constructionCompliance", "constructionCompliance")
      ? db.from("Project").select("id").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("constructionCompliance", "constructionCompliance")
      ? db.from("ConstructionShaPlan").select("projectId").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("audits", "audits")
      ? db.from("Audit").select("status, scheduledDate").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    include("environment", "environment")
      ? db.from("EnvironmentalAspect").select("id").eq("tenantId", tenantId)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  let hasPublished = false;
  const handbook = handbookRes.data as {
    lastReviewedAt?: string | null;
    currentVersionId?: string | null;
  } | null;
  if (handbook?.currentVersionId) {
    const { data: version } = await db
      .from("HandbookVersion")
      .select("status")
      .eq("id", handbook.currentVersionId)
      .maybeSingle();
    hasPublished = (version as { status?: string } | null)?.status === APPROVED_POLICY;
  }

  const risks = (risksRes.data ?? []) as Array<Record<string, unknown>>;
  const openRisks = risks.filter((row) => row.status !== CLOSED_RISK);
  const incidents = (incidentsRes.data ?? []) as Array<Record<string, unknown>>;
  const measures = (measuresRes.data ?? []) as Array<Record<string, unknown>>;
  const inspections = (inspectionsRes.data ?? []) as Array<Record<string, unknown>>;
  const drills = (drillsRes.data ?? []) as Array<Record<string, unknown>>;
  const fireAssessments = (fraRes.data ?? []) as Array<Record<string, unknown>>;
  const trainings = (trainingsRes.data ?? []) as Array<Record<string, unknown>>;
  const documents = (documentsRes.data ?? []) as Array<Record<string, unknown>>;
  const sja = (sjaRes.data ?? []) as Array<Record<string, unknown>>;
  const chemicals = (chemicalsRes.data ?? []) as Array<Record<string, unknown>>;
  const exposure = (exposureRes.data ?? []) as Array<Record<string, unknown>>;
  const projects = (projectsRes.data ?? []) as Array<Record<string, unknown>>;
  const cpp = new Set(
    ((cppRes.data ?? []) as Array<{ projectId?: string }>).map((row) => row.projectId).filter(Boolean),
  );
  const audits = (auditsRes.data ?? []) as Array<Record<string, unknown>>;
  const aspects = (environmentRes.data ?? []) as Array<Record<string, unknown>>;

  const input: HseqStatusInput = {
    now,
    enabledModules,
    allowedKeys,
    policy: {
      hasPublished,
      lastReviewedAt: handbook?.lastReviewedAt ?? null,
    },
    risks: {
      total: openRisks.length,
      criticalCount: openRisks.filter((row) => Number(row.score ?? 0) >= 15).length,
      overdueReviewCount: openRisks.filter((row) => {
        const review = asDate(row.nextReviewDate as string | null);
        return review !== null && review < now;
      }).length,
    },
    incidents: {
      openCount: incidents.filter((row) => OPEN_INCIDENT.has(String(row.status))).length,
      overdueRiddorCount: incidents.filter((row) => {
        if (!row.riddorReportable || row.riddorReportedAt) return false;
        const due = asDate(row.riddorDueAt as string | null);
        return due !== null && due < now;
      }).length,
      pendingRiddorCount: incidents.filter(
        (row) => Boolean(row.riddorReportable) && !row.riddorReportedAt,
      ).length,
    },
    actions: {
      overdueCount: measures.filter((row) => {
        if (row.status === DONE_ACTION) return false;
        const due = asDate(row.dueAt as string | null);
        return due !== null && due < now;
      }).length,
      openCount: measures.filter((row) => row.status !== DONE_ACTION).length,
    },
    inspections: {
      total: inspections.length,
      overdueCount: inspections.filter((row) => {
        if (CLOSED_INSPECTION.has(String(row.status))) return false;
        const scheduled = asDate(row.scheduledDate as string | null);
        return scheduled !== null && scheduled < now;
      }).length,
    },
    fireDrills: {
      hasAny: drills.length > 0,
      completedInLastYear: drills.some((row) => {
        if (!COMPLETED_DRILL.has(String(row.status))) return false;
        const completed = asDate(row.completedAt as string | null);
        return completed !== null && completed >= yearAgo;
      }),
      hasRecordedAssessment: fireAssessments.some((row) => {
        const status = String(row.status);
        return status === "COMPLETED" || status === "REVIEW_DUE";
      }),
      assessmentReviewOverdue: fireAssessments.some((row) => {
        if (String(row.status) === "ARCHIVED") return false;
        const review = asDate(row.reviewDate as string | null);
        return review !== null && review < now;
      }),
    },
    training: {
      expiredCount: trainings.filter((row) => {
        const validUntil = asDate(row.validUntil as string | null);
        return validUntil !== null && validUntil < now;
      }).length,
    },
    documents: { total: documents.length },
  };

  if (include("sja", "sja")) {
    input.sja = { total: sja.length };
  }
  if (include("chemicals", "chemicals")) {
    input.chemicals = {
      total: chemicals.length,
      missingSdsCount: chemicals.filter((row) => !row.sdsKey).length,
      overdueReviewCount: chemicals.filter((row) => {
        const review = asDate(row.nextReviewDate as string | null);
        return review !== null && review < now;
      }).length,
    };
  }
  if (include("exposureRegister", "chemicals")) {
    input.exposureRegister = { total: exposure.length };
  }
  if (include("constructionCompliance", "constructionCompliance")) {
    input.constructionCompliance = {
      projectCount: projects.length,
      missingCppCount: projects.filter((row) => !cpp.has(String(row.id))).length,
    };
  }
  if (include("audits", "audits")) {
    input.audits = {
      total: audits.length,
      overdueCount: audits.filter((row) => {
        if (CLOSED_AUDIT.has(String(row.status))) return false;
        const scheduled = asDate(row.scheduledDate as string | null);
        return scheduled !== null && scheduled < now;
      }).length,
      upcomingCount: audits.filter((row) => {
        if (CLOSED_AUDIT.has(String(row.status))) return false;
        const scheduled = asDate(row.scheduledDate as string | null);
        return scheduled !== null && scheduled >= now && scheduled <= weekAhead;
      }).length,
    };
  }
  if (include("environment", "environment")) {
    input.environment = { total: aspects.length };
  }

  return input;
}
