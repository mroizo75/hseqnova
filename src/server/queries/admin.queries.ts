import { getAdminDb } from "@/lib/supabase/admin";
import { OPEN_DEAL_STAGES } from "@/features/crm/lib/types";
import {
  buildAttentionQueue,
  daysUntil,
  monthlyRecurringGbp,
  type AttentionItem,
  type OrganisationStatusCounts,
} from "@/lib/admin-dashboard";

function throwIf(error: { message: string } | null, code: string): void {
  if (error) {
    throw { code, message: error.message };
  }
}

function asDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function activityLevel(lastLogin: Date | null, recentIncidents: number, recentDocuments: number) {
  const daysSinceLogin = lastLogin
    ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const totalActivity = recentIncidents + recentDocuments;

  if (daysSinceLogin <= 7 && totalActivity >= 3) {
    return { level: "high", label: "Active", color: "text-green-600", bg: "bg-green-600" };
  }
  if (daysSinceLogin <= 14 && totalActivity >= 1) {
    return { level: "medium", label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-500" };
  }
  if (daysSinceLogin <= 30) {
    return { level: "low", label: "Low activity", color: "text-orange-500", bg: "bg-orange-500" };
  }
  return { level: "inactive", label: "Inactive", color: "text-destructive", bg: "bg-destructive" };
}

export type AdminDashboardRecentOrg = {
  id: string;
  name: string;
  status: string;
  industry: string | null;
  createdAt: Date;
};

export type AdminDashboardTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  lastMessageAt: Date;
  organisationName: string;
};

export type AdminDashboardTrial = {
  id: string;
  name: string;
  trialEndsAt: Date;
  daysLeft: number;
};

export type AdminDashboardDemo = {
  id: string;
  company: string;
  name: string;
  startAt: Date;
  endAt: Date;
};

export type AdminCommandCentre = {
  counts: OrganisationStatusCounts;
  liveOrganisations: number;
  totalUsers: number;
  incidentsThisMonth: number;
  openActions: number;
  monthlyRecurringGbp: number;
  pipelineValueGbp: number;
  openDealCount: number;
  overdueInvoiceCount: number;
  overdueInvoiceGbp: number;
  openSupportCount: number;
  pendingRegistrations: number;
  attention: AttentionItem[];
  recentOrganisations: AdminDashboardRecentOrg[];
  tickets: AdminDashboardTicket[];
  trialsEnding: AdminDashboardTrial[];
  upcomingDemos: AdminDashboardDemo[];
};

async function optionalSelect<T>(
  run: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await run;
  if (error) return [];
  return data ?? [];
}

export async function loadAdminCommandCentre(opts: {
  includeCommercial: boolean;
}): Promise<AdminCommandCentre> {
  const db = getAdminDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    activeRes,
    trialRes,
    suspendedRes,
    cancelledRes,
    usersRes,
    incidentsRes,
    actionsRes,
    supportCountRes,
    registrationRes,
    recentOrgsRes,
    trialOrgsRes,
    ticketsRes,
  ] = await Promise.all([
    db.from("Tenant").select("id", { count: "exact", head: true }).eq("status", "ACTIVE").is("deletedAt", null),
    db.from("Tenant").select("id", { count: "exact", head: true }).eq("status", "TRIAL").is("deletedAt", null),
    db.from("Tenant").select("id", { count: "exact", head: true }).eq("status", "SUSPENDED").is("deletedAt", null),
    db.from("Tenant").select("id", { count: "exact", head: true }).eq("status", "CANCELLED").is("deletedAt", null),
    db.from("User").select("id", { count: "exact", head: true }),
    db.from("Incident").select("id", { count: "exact", head: true }).gte("createdAt", thirtyDaysAgo.toISOString()),
    db.from("Measure").select("id", { count: "exact", head: true }).in("status", ["PENDING", "IN_PROGRESS", "OVERDUE"]),
    db.from("SupportTicket").select("id", { count: "exact", head: true }).in("status", ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"]),
    db
      .from("Tenant")
      .select("id", { count: "exact", head: true })
      .neq("status", "CANCELLED")
      .in("onboardingStatus", ["NOT_STARTED", "IN_PROGRESS", "ADMIN_CREATED"]),
    db
      .from("Tenant")
      .select("id, name, status, industry, createdAt")
      .is("deletedAt", null)
      .order("createdAt", { ascending: false })
      .limit(8),
    db
      .from("Tenant")
      .select("id, name, trialEndsAt")
      .eq("status", "TRIAL")
      .is("deletedAt", null)
      .not("trialEndsAt", "is", null)
      .lte("trialEndsAt", fourteenDays.toISOString())
      .gte("trialEndsAt", now.toISOString())
      .order("trialEndsAt", { ascending: true })
      .limit(6),
    db
      .from("SupportTicket")
      .select("id, ticketNumber, subject, status, lastMessageAt, tenantId")
      .in("status", ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"])
      .order("lastMessageAt", { ascending: false })
      .limit(6),
  ]);

  throwIf(activeRes.error, "TENANT_COUNT_FAILED");
  throwIf(trialRes.error, "TENANT_COUNT_FAILED");
  throwIf(suspendedRes.error, "TENANT_COUNT_FAILED");
  throwIf(cancelledRes.error, "TENANT_COUNT_FAILED");
  throwIf(usersRes.error, "USER_COUNT_FAILED");
  throwIf(incidentsRes.error, "INCIDENT_COUNT_FAILED");
  throwIf(actionsRes.error, "ACTION_COUNT_FAILED");
  throwIf(supportCountRes.error, "SUPPORT_COUNT_FAILED");
  throwIf(registrationRes.error, "REGISTRATION_COUNT_FAILED");
  throwIf(recentOrgsRes.error, "TENANT_LIST_FAILED");
  throwIf(trialOrgsRes.error, "TRIAL_LIST_FAILED");
  throwIf(ticketsRes.error, "SUPPORT_LIST_FAILED");

  const ticketRows = ticketsRes.data ?? [];
  const ticketTenantIds = [...new Set(ticketRows.map((row) => String(row.tenantId)))];
  const { data: ticketTenants, error: ticketTenantError } =
    ticketTenantIds.length > 0
      ? await db.from("Tenant").select("id, name").in("id", ticketTenantIds)
      : { data: [], error: null };
  throwIf(ticketTenantError, "TENANT_LOOKUP_FAILED");
  const tenantNameById = new Map((ticketTenants ?? []).map((row) => [String(row.id), String(row.name)]));

  let overdueInvoices: Array<{ amount: number }> = [];
  let subscriptions: Array<{ price: number; billingInterval: string; status: string }> = [];
  let openDeals: Array<{ valueGbp: number }> = [];
  let overdueTaskCount = 0;
  let upcomingDemos: AdminDashboardDemo[] = [];

  if (opts.includeCommercial) {
    const [invoiceRows, subscriptionRows, dealRows, taskRows, demoRows] = await Promise.all([
      optionalSelect(
        db.from("Invoice").select("amount").eq("status", "OVERDUE"),
      ),
      optionalSelect(
        db.from("Subscription").select("price, billingInterval, status").in("status", ["ACTIVE", "TRIAL"]),
      ),
      optionalSelect(
        db.from("CrmDeal").select("valueGbp, stage").in("stage", [...OPEN_DEAL_STAGES]),
      ),
      optionalSelect(
        db.from("CrmTask").select("id, dueAt, status").eq("status", "OPEN").lt("dueAt", now.toISOString()),
      ),
      optionalSelect(
        db
          .from("DemoBooking")
          .select("id, company, name, startAt, endAt, status")
          .eq("status", "CONFIRMED")
          .gte("startAt", now.toISOString())
          .order("startAt", { ascending: true })
          .limit(5),
      ),
    ]);

    overdueInvoices = invoiceRows.map((row) => ({ amount: Number(row.amount ?? 0) }));
    subscriptions = subscriptionRows.map((row) => ({
      price: Number(row.price ?? 0),
      billingInterval: String(row.billingInterval ?? "MONTHLY"),
      status: String(row.status),
    }));
    openDeals = dealRows.map((row) => ({ valueGbp: Number(row.valueGbp ?? 0) }));
    overdueTaskCount = taskRows.length;
    upcomingDemos = demoRows.map((row) => ({
      id: String(row.id),
      company: String(row.company),
      name: String(row.name),
      startAt: new Date(String(row.startAt)),
      endAt: new Date(String(row.endAt)),
    }));
  }

  const counts: OrganisationStatusCounts = {
    active: activeRes.count ?? 0,
    trial: trialRes.count ?? 0,
    suspended: suspendedRes.count ?? 0,
    cancelled: cancelledRes.count ?? 0,
  };
  const overdueInvoiceGbp = overdueInvoices.reduce((sum, row) => sum + row.amount, 0);
  const openSupportCount = supportCountRes.count ?? 0;
  const pendingRegistrations = registrationRes.count ?? 0;
  const trialsEnding = (trialOrgsRes.data ?? [])
    .map((row) => {
      const trialEndsAt = asDate(row.trialEndsAt as string | null);
      if (!trialEndsAt) return null;
      return {
        id: String(row.id),
        name: String(row.name),
        trialEndsAt,
        daysLeft: daysUntil(trialEndsAt, now),
      };
    })
    .filter((row): row is AdminDashboardTrial => row !== null);

  return {
    counts,
    liveOrganisations: counts.active + counts.trial,
    totalUsers: usersRes.count ?? 0,
    incidentsThisMonth: incidentsRes.count ?? 0,
    openActions: actionsRes.count ?? 0,
    monthlyRecurringGbp: monthlyRecurringGbp(subscriptions),
    pipelineValueGbp: openDeals.reduce((sum, deal) => sum + deal.valueGbp, 0),
    openDealCount: openDeals.length,
    overdueInvoiceCount: overdueInvoices.length,
    overdueInvoiceGbp,
    openSupportCount,
    pendingRegistrations,
    attention: buildAttentionQueue({
      overdueInvoiceCount: overdueInvoices.length,
      overdueInvoiceGbp,
      openSupportCount,
      trialsEndingSoon: trialsEnding.length,
      pendingRegistrations,
      overdueCrmTasks: overdueTaskCount,
      suspendedCount: counts.suspended,
    }),
    recentOrganisations: (recentOrgsRes.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      status: String(row.status),
      industry: (row.industry as string | null) ?? null,
      createdAt: asDate(row.createdAt as string) ?? now,
    })),
    tickets: ticketRows.map((row) => ({
      id: String(row.id),
      ticketNumber: String(row.ticketNumber),
      subject: String(row.subject),
      status: String(row.status),
      lastMessageAt: asDate(row.lastMessageAt as string) ?? now,
      organisationName: tenantNameById.get(String(row.tenantId)) ?? "Organisation",
    })),
    trialsEnding,
    upcomingDemos,
  };
}

export type AdminTenantListItem = {
  id: string;
  name: string;
  slug: string;
  orgNumber: string | null;
  status: string;
  subscription: { plan: string; price: number; billingInterval: string } | null;
  offers: Array<{ status: string }>;
  overdueInvoiceCount: number;
  lastLogin: Date | null;
  recentIncidents: number;
  recentDocuments: number;
  userCount: number;
  riskCount: number;
  activity: ReturnType<typeof activityLevel>;
};

export async function loadAdminTenants(): Promise<AdminTenantListItem[]> {
  const db = getAdminDb();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tenants, error } = await db
    .from("Tenant")
    .select("id, name, slug, orgNumber, status, createdAt")
    .order("createdAt", { ascending: false });
  throwIf(error, "TENANT_LIST_FAILED");

  const rows = (tenants ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    orgNumber: string | null;
    status: string;
  }>;
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [
    membershipsRes,
    subscriptionsRes,
    offersRes,
    invoicesRes,
    incidentsRes,
    documentsRes,
    risksRes,
  ] = await Promise.all([
    db.from("UserTenant").select("tenantId, userId").in("tenantId", ids),
    db.from("Subscription").select("tenantId, plan, price, billingInterval").in("tenantId", ids),
    db.from("TenantOffer").select("tenantId, status, createdAt").in("tenantId", ids).order("createdAt", { ascending: false }),
    db.from("Invoice").select("id, tenantId").eq("status", "OVERDUE").in("tenantId", ids),
    db.from("Incident").select("tenantId").gte("createdAt", thirtyDaysAgo).in("tenantId", ids),
    db.from("Document").select("tenantId").gte("createdAt", thirtyDaysAgo).in("tenantId", ids),
    db.from("Risk").select("tenantId").in("tenantId", ids),
  ]);

  throwIf(membershipsRes.error, "MEMBERSHIP_LIST_FAILED");
  throwIf(subscriptionsRes.error, "SUBSCRIPTION_LIST_FAILED");
  throwIf(offersRes.error, "OFFER_LIST_FAILED");
  throwIf(invoicesRes.error, "INVOICE_LIST_FAILED");
  throwIf(incidentsRes.error, "INCIDENT_LIST_FAILED");
  throwIf(documentsRes.error, "DOCUMENT_LIST_FAILED");
  throwIf(risksRes.error, "RISK_LIST_FAILED");

  const userIds = [...new Set((membershipsRes.data ?? []).map((row) => row.userId as string))];
  const { data: users, error: usersError } =
    userIds.length > 0
      ? await db.from("User").select("id, lastLoginAttempt").in("id", userIds)
      : { data: [], error: null };
  throwIf(usersError, "USER_LIST_FAILED");

  const loginByUser = new Map(
    (users ?? []).map((user) => [user.id as string, asDate(user.lastLoginAttempt as string | null)]),
  );
  const membersByTenant = new Map<string, string[]>();
  for (const row of membershipsRes.data ?? []) {
    const list = membersByTenant.get(row.tenantId as string) ?? [];
    list.push(row.userId as string);
    membersByTenant.set(row.tenantId as string, list);
  }

  const subByTenant = new Map(
    (subscriptionsRes.data ?? []).map((row) => [
      row.tenantId as string,
      {
        plan: String(row.plan),
        price: Number(row.price),
        billingInterval: String(row.billingInterval),
      },
    ]),
  );
  const offerByTenant = new Map<string, { status: string }>();
  for (const row of offersRes.data ?? []) {
    const tenantId = row.tenantId as string;
    if (!offerByTenant.has(tenantId)) {
      offerByTenant.set(tenantId, { status: String(row.status) });
    }
  }
  const overdueByTenant = new Map<string, number>();
  for (const row of invoicesRes.data ?? []) {
    const tenantId = row.tenantId as string;
    overdueByTenant.set(tenantId, (overdueByTenant.get(tenantId) ?? 0) + 1);
  }
  const countBy = (rows: Array<{ tenantId?: string }> | null) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      const tenantId = row.tenantId as string;
      map.set(tenantId, (map.get(tenantId) ?? 0) + 1);
    }
    return map;
  };
  const recentIncidents = countBy(incidentsRes.data);
  const recentDocuments = countBy(documentsRes.data);
  const riskCounts = countBy(risksRes.data);

  return rows
    .filter((row) => (membersByTenant.get(row.id) ?? []).length > 0)
    .map((row) => {
      const memberIds = membersByTenant.get(row.id) ?? [];
      const lastLogin = memberIds.reduce<Date | null>((latest, userId) => {
        const login = loginByUser.get(userId);
        if (!login) return latest;
        return !latest || login > latest ? login : latest;
      }, null);
      const incidents = recentIncidents.get(row.id) ?? 0;
      const documents = recentDocuments.get(row.id) ?? 0;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        orgNumber: row.orgNumber,
        status: row.status,
        subscription: subByTenant.get(row.id) ?? null,
        offers: offerByTenant.get(row.id) ? [offerByTenant.get(row.id)!] : [],
        overdueInvoiceCount: overdueByTenant.get(row.id) ?? 0,
        lastLogin,
        recentIncidents: incidents,
        recentDocuments: documents,
        userCount: memberIds.length,
        riskCount: riskCounts.get(row.id) ?? 0,
        activity: activityLevel(lastLogin, incidents, documents),
      };
    });
}

export async function loadAdminTenantOptions() {
  const { data, error } = await getAdminDb()
    .from("Tenant")
    .select("id, name, status")
    .order("name", { ascending: true });
  throwIf(error, "TENANT_OPTIONS_FAILED");
  return (data ?? []) as Array<{ id: string; name: string; status: string }>;
}

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  isSupport: boolean;
  isSales: boolean;
  isSalesManager: boolean;
  createdAt: Date;
  tenants: Array<{ role: string; tenant: { id: string; name: string } }>;
};

export async function loadAdminUsers(opts: { page: number; pageSize: number; search: string }) {
  const db = getAdminDb();
  const safeSearch = opts.search.replace(/[%_,]/g, "").trim();
  let query = db
    .from("User")
    .select("id, email, name, isSuperAdmin, isSupport, isSales, isSalesManager, createdAt", { count: "exact" })
    .order("createdAt", { ascending: false });

  if (safeSearch) {
    const { data: namedTenants } = await db.from("Tenant").select("id").ilike("name", `%${safeSearch}%`);
    const tenantIds = (namedTenants ?? []).map((row) => row.id as string);
    let extraUserIds: string[] = [];
    if (tenantIds.length > 0) {
      const { data: mems } = await db.from("UserTenant").select("userId").in("tenantId", tenantIds);
      extraUserIds = [...new Set((mems ?? []).map((row) => row.userId as string))];
    }
    const idFilter = extraUserIds.length > 0 ? `,id.in.(${extraUserIds.join(",")})` : "";
    query = query.or(`email.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%${idFilter}`);
  }

  const from = (opts.page - 1) * opts.pageSize;
  const to = from + opts.pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  throwIf(error, "USER_LIST_FAILED");

  const users = (data ?? []) as Array<{
    id: string;
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
    isSupport: boolean;
    isSales: boolean;
    isSalesManager: boolean;
    createdAt: string;
  }>;
  const userIds = users.map((user) => user.id);
  const { data: memberships, error: memError } =
    userIds.length > 0
      ? await db.from("UserTenant").select("userId, tenantId, role").in("userId", userIds)
      : { data: [], error: null };
  throwIf(memError, "MEMBERSHIP_LIST_FAILED");

  const tenantIds = [...new Set((memberships ?? []).map((row) => row.tenantId as string))];
  const { data: tenants, error: tenantError } =
    tenantIds.length > 0
      ? await db.from("Tenant").select("id, name").in("id", tenantIds)
      : { data: [], error: null };
  throwIf(tenantError, "TENANT_LIST_FAILED");

  const tenantById = new Map((tenants ?? []).map((tenant) => [tenant.id as string, tenant.name as string]));
  const memsByUser = new Map<string, Array<{ role: string; tenant: { id: string; name: string } }>>();
  for (const row of memberships ?? []) {
    const list = memsByUser.get(row.userId as string) ?? [];
    list.push({
      role: String(row.role),
      tenant: { id: row.tenantId as string, name: tenantById.get(row.tenantId as string) ?? "Organisation" },
    });
    memsByUser.set(row.userId as string, list);
  }

  const items: AdminUserListItem[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    isSupport: Boolean(user.isSupport),
    isSales: Boolean(user.isSales),
    isSalesManager: Boolean(user.isSalesManager),
    createdAt: new Date(user.createdAt),
    tenants: memsByUser.get(user.id) ?? [],
  }));

  return { users: items, total: count ?? items.length };
}

export async function loadAdminUserEditor(userId: string) {
  const db = getAdminDb();
  const { data: user, error } = await db
    .from("User")
    .select("id, email, name, isSuperAdmin, isSupport, isSales, isSalesManager, canBeExternalCompetentPerson")
    .eq("id", userId)
    .maybeSingle();
  throwIf(error, "USER_LOOKUP_FAILED");
  if (!user) return null;

  const { data: memberships, error: memError } = await db
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", userId);
  throwIf(memError, "MEMBERSHIP_LOOKUP_FAILED");

  return {
    id: user.id as string,
    email: user.email as string,
    name: (user.name as string | null) ?? null,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    isSupport: Boolean(user.isSupport),
    isSales: Boolean(user.isSales),
    isSalesManager: Boolean(user.isSalesManager),
    canBeExternalCompetentPerson: Boolean(user.canBeExternalCompetentPerson),
    tenants: (memberships ?? []).map((row) => ({
      tenantId: row.tenantId as string,
      role: row.role as AdminUserListItem["tenants"][number]["role"],
    })),
  };
}

export async function loadAdminInvoices() {
  const db = getAdminDb();
  const [invoicesRes, tenantsRes, exportsRes] = await Promise.all([
    db.from("Invoice").select("*").order("dueDate", { ascending: false }).limit(200),
    db.from("Tenant").select("id, name").in("status", ["ACTIVE", "TRIAL"]).order("name", { ascending: true }),
    db.from("InvoiceExport").select("*").order("createdAt", { ascending: false }).limit(20),
  ]);
  throwIf(invoicesRes.error, "INVOICE_LIST_FAILED");
  throwIf(tenantsRes.error, "TENANT_LIST_FAILED");
  throwIf(exportsRes.error, "EXPORT_LIST_FAILED");

  const invoices = invoicesRes.data ?? [];
  const tenantIds = [...new Set(invoices.map((row) => row.tenantId as string))];
  const { data: invoiceTenants, error: invoiceTenantError } =
    tenantIds.length > 0
      ? await db.from("Tenant").select("id, name, contactEmail, invoiceEmail").in("id", tenantIds)
      : { data: [], error: null };
  throwIf(invoiceTenantError, "TENANT_LOOKUP_FAILED");
  const tenantById = new Map((invoiceTenants ?? []).map((tenant) => [tenant.id as string, tenant]));

  const exporterIds = [...new Set((exportsRes.data ?? []).map((row) => row.exportedById as string))];
  const { data: exporters, error: exporterError } =
    exporterIds.length > 0
      ? await db.from("User").select("id, name, email").in("id", exporterIds)
      : { data: [], error: null };
  throwIf(exporterError, "USER_LOOKUP_FAILED");
  const exporterById = new Map((exporters ?? []).map((user) => [user.id as string, user]));

  return {
    invoices: invoices.map((row) => ({
      ...row,
      amount: Number(row.amount),
      dueDate: new Date(row.dueDate as string),
      paidDate: row.paidDate ? new Date(row.paidDate as string) : null,
      createdAt: new Date(row.createdAt as string),
      tenant: {
        name: (tenantById.get(row.tenantId as string)?.name as string | undefined) ?? "Organisation",
        contactEmail: (tenantById.get(row.tenantId as string)?.contactEmail as string | null | undefined) ?? null,
        invoiceEmail: (tenantById.get(row.tenantId as string)?.invoiceEmail as string | null | undefined) ?? null,
      },
    })),
    tenants: (tenantsRes.data ?? []) as Array<{ id: string; name: string }>,
    exportHistory: (exportsRes.data ?? []).map((row) => ({
      ...row,
      periodStart: new Date(row.periodStart as string),
      periodEnd: new Date(row.periodEnd as string),
      createdAt: new Date(row.createdAt as string),
      exportedBy: {
        name: (exporterById.get(row.exportedById as string)?.name as string | null | undefined) ?? null,
        email: (exporterById.get(row.exportedById as string)?.email as string | undefined) ?? "",
      },
    })),
  };
}

export async function loadAdminTavleSubscriptions() {
  const db = getAdminDb();
  const { data: subscriptions, error } = await db
    .from("HmsTavleSubscription")
    .select("*")
    .order("endsAt", { ascending: true });
  throwIf(error, "TAVLE_LIST_FAILED");

  const rows = subscriptions ?? [];
  const tenantIds = rows.map((row) => row.tenantId as string);
  const { data: tenants, error: tenantError } =
    tenantIds.length > 0
      ? await db.from("Tenant").select("id, name, contactEmail, orgNumber, isTavleOnly").in("id", tenantIds)
      : { data: [], error: null };
  throwIf(tenantError, "TENANT_LOOKUP_FAILED");
  const tenantById = new Map((tenants ?? []).map((tenant) => [tenant.id as string, tenant]));

  const { data: boards, error: boardError } =
    tenantIds.length > 0
      ? await db.from("HmsTavle").select("id, tenantId").in("tenantId", tenantIds)
      : { data: [], error: null };
  throwIf(boardError, "TAVLE_COUNT_FAILED");
  const boardCount = new Map<string, number>();
  for (const board of boards ?? []) {
    const tenantId = board.tenantId as string;
    boardCount.set(tenantId, (boardCount.get(tenantId) ?? 0) + 1);
  }

  return rows.map((row) => {
    const tenant = tenantById.get(row.tenantId as string);
    return {
      ...row,
      endsAt: new Date(row.endsAt as string),
      pricePerMonth: Number(row.pricePerMonth),
      tenant: {
        name: (tenant?.name as string | undefined) ?? "Organisation",
        contactEmail: (tenant?.contactEmail as string | null | undefined) ?? null,
        orgNumber: (tenant?.orgNumber as string | null | undefined) ?? null,
        isTavleOnly: Boolean(tenant?.isTavleOnly),
        _count: { hmsTavler: boardCount.get(row.tenantId as string) ?? 0 },
      },
    };
  });
}

export async function loadAdminTenantDetails(tenantId: string) {
  const db = getAdminDb();
  const { data: tenant, error } = await db.from("Tenant").select("*").eq("id", tenantId).maybeSingle();
  throwIf(error, "TENANT_LOOKUP_FAILED");
  if (!tenant) return null;

  const [
    subscriptionRes,
    membersRes,
    invoicesRes,
    offersRes,
    activitiesRes,
    reviewsRes,
    usersCount,
    documentsCount,
    incidentsCount,
    risksCount,
  ] = await Promise.all([
    db.from("Subscription").select("*").eq("tenantId", tenantId).maybeSingle(),
    db.from("UserTenant").select("id, role, tenantId, userId, createdAt").eq("tenantId", tenantId).order("createdAt", { ascending: false }),
    db.from("Invoice").select("*").eq("tenantId", tenantId).order("createdAt", { ascending: false }).limit(10),
    db.from("TenantOffer").select("*").eq("tenantId", tenantId).order("createdAt", { ascending: false }).limit(5),
    db.from("TenantActivity").select("*").eq("tenantId", tenantId).order("createdAt", { ascending: false }).limit(50),
    db.from("ManagementReview").select("*").eq("tenantId", tenantId).order("reviewDate", { ascending: false }).limit(1),
    db.from("UserTenant").select("id", { count: "exact", head: true }).eq("tenantId", tenantId),
    db.from("Document").select("id", { count: "exact", head: true }).eq("tenantId", tenantId),
    db.from("Incident").select("id", { count: "exact", head: true }).eq("tenantId", tenantId),
    db.from("Risk").select("id", { count: "exact", head: true }).eq("tenantId", tenantId),
  ]);

  throwIf(subscriptionRes.error, "SUBSCRIPTION_LOOKUP_FAILED");
  throwIf(membersRes.error, "MEMBERSHIP_LOOKUP_FAILED");
  throwIf(invoicesRes.error, "INVOICE_LOOKUP_FAILED");
  throwIf(offersRes.error, "OFFER_LOOKUP_FAILED");
  throwIf(activitiesRes.error, "ACTIVITY_LOOKUP_FAILED");
  throwIf(reviewsRes.error, "REVIEW_LOOKUP_FAILED");
  throwIf(usersCount.error, "USER_COUNT_FAILED");
  throwIf(documentsCount.error, "DOCUMENT_COUNT_FAILED");
  throwIf(incidentsCount.error, "INCIDENT_COUNT_FAILED");
  throwIf(risksCount.error, "RISK_COUNT_FAILED");

  const userIds = (membersRes.data ?? []).map((row) => row.userId as string);
  const { data: users, error: usersError } =
    userIds.length > 0
      ? await db.from("User").select("id, name, email, emailVerified, createdAt").in("id", userIds)
      : { data: [], error: null };
  throwIf(usersError, "USER_LOOKUP_FAILED");
  const userById = new Map((users ?? []).map((user) => [user.id as string, user]));

  return {
    ...tenant,
    subscription: subscriptionRes.data,
    users: (membersRes.data ?? []).map((row) => ({
      ...row,
      user: userById.get(row.userId as string) ?? null,
    })),
    invoices: invoicesRes.data ?? [],
    offers: offersRes.data ?? [],
    activities: activitiesRes.data ?? [],
    managementReviews: reviewsRes.data ?? [],
    _count: {
      users: usersCount.count ?? 0,
      documents: documentsCount.count ?? 0,
      incidents: incidentsCount.count ?? 0,
      risks: risksCount.count ?? 0,
    },
  };
}
