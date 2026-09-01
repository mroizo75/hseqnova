import { getAdminDb } from "@/lib/supabase/admin";
import { canSeeAllCrm, type PlatformStaff } from "@/lib/platform-access";
import { OPEN_DEAL_STAGES, type CrmDealStage } from "@/features/crm/lib/types";

function throwIf(error: { message: string } | null, code: string): void {
  if (error) {
    throw { code, message: error.message };
  }
}

export type CrmOwnerRef = { id: string; name: string | null; email: string };

export type CrmDealListItem = {
  id: string;
  title: string;
  stage: CrmDealStage;
  valueGbp: number;
  expectedCloseAt: string | null;
  ownerId: string | null;
  owner: CrmOwnerRef | null;
  organisation: {
    id: string;
    name: string;
    tenantId: string | null;
  };
};

export type CrmTaskListItem = {
  id: string;
  title: string;
  dueAt: string | null;
  status: "OPEN" | "DONE";
  assignedToId: string;
  assignedTo: CrmOwnerRef | null;
  organisation: { id: string; name: string };
  dealId: string | null;
};

function ownerScope(staff: PlatformStaff) {
  if (canSeeAllCrm(staff)) {
    return null;
  }
  return staff.id;
}

async function loadUsersById(ids: string[]): Promise<Map<string, CrmOwnerRef>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) {
    return new Map();
  }
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email")
    .in("id", unique);
  throwIf(error, "CRM_USER_LOOKUP_FAILED");
  return new Map(
    (data ?? []).map((row) => [
      String(row.id),
      { id: String(row.id), name: (row.name as string | null) ?? null, email: String(row.email) },
    ]),
  );
}

export async function loadCrmPipeline(staff: PlatformStaff): Promise<CrmDealListItem[]> {
  const db = getAdminDb();
  let query = db
    .from("CrmDeal")
    .select("id, title, stage, valueGbp, expectedCloseAt, ownerId, organisationId")
    .order("updatedAt", { ascending: false });

  const ownerId = ownerScope(staff);
  if (ownerId) {
    query = query.eq("ownerId", ownerId);
  }

  const { data, error } = await query;
  throwIf(error, "CRM_PIPELINE_FAILED");

  const deals = data ?? [];
  const orgIds = [...new Set(deals.map((row) => String(row.organisationId)))];
  const { data: orgs, error: orgError } =
    orgIds.length > 0
      ? await db.from("CrmOrganisation").select("id, name, tenantId").in("id", orgIds)
      : { data: [], error: null };
  throwIf(orgError, "CRM_ORG_LOOKUP_FAILED");
  const orgById = new Map((orgs ?? []).map((org) => [String(org.id), org]));
  const owners = await loadUsersById(deals.map((row) => String(row.ownerId ?? "")));

  return deals.map((row) => {
    const org = orgById.get(String(row.organisationId));
    return {
      id: String(row.id),
      title: String(row.title),
      stage: row.stage as CrmDealStage,
      valueGbp: Number(row.valueGbp ?? 0),
      expectedCloseAt: (row.expectedCloseAt as string | null) ?? null,
      ownerId: (row.ownerId as string | null) ?? null,
      owner: row.ownerId ? owners.get(String(row.ownerId)) ?? null : null,
      organisation: {
        id: String(row.organisationId),
        name: org ? String(org.name) : "Organisation",
        tenantId: org ? ((org.tenantId as string | null) ?? null) : null,
      },
    };
  });
}

export async function loadCrmDashboard(staff: PlatformStaff) {
  const deals = await loadCrmPipeline(staff);
  const openDeals = deals.filter((deal) =>
    (OPEN_DEAL_STAGES as readonly string[]).includes(deal.stage),
  );
  const wonDeals = deals.filter((deal) => deal.stage === "WON");
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.valueGbp, 0);
  const byStage = OPEN_DEAL_STAGES.map((stage) => ({
    stage,
    count: openDeals.filter((deal) => deal.stage === stage).length,
    value: openDeals
      .filter((deal) => deal.stage === stage)
      .reduce((sum, deal) => sum + deal.valueGbp, 0),
  }));

  const tasks = await loadCrmTasks(staff, { openOnly: true });
  const overdue = tasks.filter(
    (task) => task.status === "OPEN" && task.dueAt && new Date(task.dueAt) < new Date(),
  );

  return {
    openDealCount: openDeals.length,
    pipelineValue,
    wonCount: wonDeals.length,
    overdueTaskCount: overdue.length,
    byStage,
    recentOpenDeals: openDeals.slice(0, 8),
    overdueTasks: overdue.slice(0, 8),
  };
}

export async function loadCrmCompanies(staff: PlatformStaff) {
  const db = getAdminDb();
  let query = db
    .from("CrmOrganisation")
    .select("id, name, companyNumber, industry, tenantId, ownerId, source, createdAt")
    .order("updatedAt", { ascending: false });
  const ownerId = ownerScope(staff);
  if (ownerId) {
    query = query.eq("ownerId", ownerId);
  }
  const { data, error } = await query;
  throwIf(error, "CRM_COMPANY_LIST_FAILED");
  const rows = data ?? [];
  const owners = await loadUsersById(rows.map((row) => String(row.ownerId ?? "")));

  const orgIds = rows.map((row) => String(row.id));
  const { data: deals } =
    orgIds.length > 0
      ? await db
          .from("CrmDeal")
          .select("id, organisationId, stage, valueGbp")
          .in("organisationId", orgIds)
          .order("updatedAt", { ascending: false })
      : { data: [] };

  const openByOrg = new Map<string, { stage: string; valueGbp: number; id: string }>();
  for (const deal of deals ?? []) {
    const key = String(deal.organisationId);
    if (openByOrg.has(key)) continue;
    if ((OPEN_DEAL_STAGES as readonly string[]).includes(String(deal.stage))) {
      openByOrg.set(key, {
        id: String(deal.id),
        stage: String(deal.stage),
        valueGbp: Number(deal.valueGbp ?? 0),
      });
    }
  }

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    companyNumber: (row.companyNumber as string | null) ?? null,
    industry: (row.industry as string | null) ?? null,
    tenantId: (row.tenantId as string | null) ?? null,
    ownerId: (row.ownerId as string | null) ?? null,
    owner: row.ownerId ? owners.get(String(row.ownerId)) ?? null : null,
    source: String(row.source),
    createdAt: String(row.createdAt),
    openDeal: openByOrg.get(String(row.id)) ?? null,
  }));
}

export async function loadCrmCompanyDetail(staff: PlatformStaff, organisationId: string) {
  const db = getAdminDb();
  const { data: org, error } = await db
    .from("CrmOrganisation")
    .select("*")
    .eq("id", organisationId)
    .maybeSingle();
  throwIf(error, "CRM_ORG_LOOKUP_FAILED");
  if (!org) return null;
  if (!canSeeAllCrm(staff) && org.ownerId !== staff.id) {
    return null;
  }

  const [{ data: contacts }, { data: deals }, { data: activities }, { data: tasks }] = await Promise.all([
    db.from("CrmContact").select("*").eq("organisationId", organisationId).order("isPrimary", { ascending: false }),
    db.from("CrmDeal").select("*").eq("organisationId", organisationId).order("createdAt", { ascending: false }),
    db
      .from("CrmActivity")
      .select("*")
      .eq("organisationId", organisationId)
      .order("createdAt", { ascending: false })
      .limit(50),
    db.from("CrmTask").select("*").eq("organisationId", organisationId).order("dueAt", { ascending: true }),
  ]);

  const userIds = [
    org.ownerId as string | null,
    ...(deals ?? []).map((row) => row.ownerId as string | null),
    ...(activities ?? []).map((row) => row.createdById as string),
    ...(tasks ?? []).map((row) => row.assignedToId as string),
  ].filter((id): id is string => Boolean(id));
  const users = await loadUsersById(userIds);

  return {
    organisation: org,
    owner: org.ownerId ? users.get(String(org.ownerId)) ?? null : null,
    contacts: contacts ?? [],
    deals: (deals ?? []).map((deal) => ({
      ...deal,
      owner: deal.ownerId ? users.get(String(deal.ownerId)) ?? null : null,
    })),
    activities: (activities ?? []).map((activity) => ({
      ...activity,
      createdBy: users.get(String(activity.createdById)) ?? null,
    })),
    tasks: (tasks ?? []).map((task) => ({
      ...task,
      assignedTo: users.get(String(task.assignedToId)) ?? null,
    })),
  };
}

export async function loadCrmDealDetail(staff: PlatformStaff, dealId: string) {
  const db = getAdminDb();
  const { data: deal, error } = await db.from("CrmDeal").select("*").eq("id", dealId).maybeSingle();
  throwIf(error, "CRM_DEAL_LOOKUP_FAILED");
  if (!deal) return null;
  if (!canSeeAllCrm(staff) && deal.ownerId !== staff.id) {
    return null;
  }

  const detail = await loadCrmCompanyDetail(staff, String(deal.organisationId));
  if (!detail) return null;
  return { deal, ...detail };
}

export async function loadCrmTasks(
  staff: PlatformStaff,
  opts?: { openOnly?: boolean },
): Promise<CrmTaskListItem[]> {
  const db = getAdminDb();
  let query = db
    .from("CrmTask")
    .select("id, title, dueAt, status, assignedToId, organisationId, dealId")
    .order("dueAt", { ascending: true });

  if (opts?.openOnly) {
    query = query.eq("status", "OPEN");
  }
  if (!canSeeAllCrm(staff)) {
    query = query.eq("assignedToId", staff.id);
  }

  const { data, error } = await query;
  throwIf(error, "CRM_TASK_LIST_FAILED");
  const rows = data ?? [];
  const orgIds = [...new Set(rows.map((row) => String(row.organisationId)))];
  const { data: orgs } =
    orgIds.length > 0
      ? await db.from("CrmOrganisation").select("id, name, ownerId").in("id", orgIds)
      : { data: [] };

  if (!canSeeAllCrm(staff)) {
    const allowed = new Set(
      (orgs ?? [])
        .filter((org) => org.ownerId === staff.id)
        .map((org) => String(org.id)),
    );
    // Sales already filtered by assignedToId; keep tasks they own even if org owner differs
    void allowed;
  }

  const orgById = new Map((orgs ?? []).map((org) => [String(org.id), String(org.name)]));
  const users = await loadUsersById(rows.map((row) => String(row.assignedToId)));

  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    dueAt: (row.dueAt as string | null) ?? null,
    status: row.status as "OPEN" | "DONE",
    assignedToId: String(row.assignedToId),
    assignedTo: users.get(String(row.assignedToId)) ?? null,
    organisation: {
      id: String(row.organisationId),
      name: orgById.get(String(row.organisationId)) ?? "Organisation",
    },
    dealId: (row.dealId as string | null) ?? null,
  }));
}

export async function loadCrmSalespeople() {
  const { data, error } = await getAdminDb()
    .from("User")
    .select("id, name, email, isSales, isSalesManager, isSuperAdmin")
    .or("isSales.eq.true,isSalesManager.eq.true,isSuperAdmin.eq.true")
    .order("name", { ascending: true });
  throwIf(error, "CRM_SALES_LOOKUP_FAILED");
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: (row.name as string | null) ?? null,
    email: String(row.email),
  }));
}
