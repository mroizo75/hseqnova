import { redirect, notFound } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { TavleAdminClient } from "@/features/hms-tavle/components/tavle-admin-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TavleAdminPage({ params, searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth.permissions.canViewHmsTavle) redirect("/dashboard");

  const { id } = await params;
  const { tab } = await searchParams;

  const db = getAdminDb();

  const [tavleRes, subscriptionRes] = await Promise.all([
    db
      .from("HmsTavle")
      .select("*")
      .eq("id", id)
      .eq("tenantId", auth.tenantId)
      .maybeSingle(),
    db
      .from("HmsTavleSubscription")
      .select("*")
      .eq("tenantId", auth.tenantId)
      .maybeSingle(),
  ]);

  const tavle = tavleRes.data;
  if (!tavle) notFound();

  const subscription = subscriptionRes.data;
  if (!subscription) redirect("/dashboard/hms-tavle");

  const today = new Date().toISOString().slice(0, 10);

  const [
    sectionsRes,
    linksRes,
    portalRes,
    checkinsRes,
    guestSubmissionsRes,
    tenantRes,
  ] = await Promise.all([
    db.from("HmsTavleSection").select("*").eq("tavleId", id).order("order", { ascending: true }),
    db.from("HmsTavleExternalLink").select("*").eq("tavleId", id).order("order", { ascending: true }),
    db.from("SubcontractorPortal").select("*").eq("tavleId", id).maybeSingle(),
    db.from("TavleCheckin").select("*").eq("tavleId", id).eq("date", today).order("checkedInAt", { ascending: true }),
    db.from("TavleGuestSubmission").select("*").eq("tavleId", id).order("createdAt", { ascending: false }).limit(100),
    db.from("Tenant").select("isTavleOnly").eq("id", auth.tenantId).maybeSingle(),
  ]);

  // Build portal with submissions
  let portalWithSubmissions = null;
  if (portalRes.data) {
    const { data: submissions } = await db
      .from("SubcontractorSubmission")
      .select("*")
      .eq("portalId", portalRes.data.id)
      .order("createdAt", { ascending: false })
      .limit(50);
    portalWithSubmissions = { ...portalRes.data, submissions: submissions ?? [] };
  }

  // Project data if linked
  let project = null;
  if (tavle.projectId) {
    const { data: projectData } = await db
      .from("Project")
      .select("*")
      .eq("id", tavle.projectId)
      .maybeSingle();

    if (projectData) {
      const [shaRes, f10Res, rosterRes] = await Promise.all([
        db.from("ConstructionShaPlan").select("id, status, updatedAt, availableOnSite").eq("projectId", projectData.id).maybeSingle(),
        db.from("ConstructionPreNotification").select("id, status, sentAt").eq("projectId", projectData.id).maybeSingle(),
        db.from("ConstructionRosterEntry").select("*").eq("projectId", projectData.id).order("createdAt", { ascending: false }).limit(100),
      ]);
      project = {
        ...projectData,
        constructionShaPlan: shaRes.data,
        constructionPreNotification: f10Res.data,
        constructionRosterEntries: rosterRes.data ?? [],
      };
    }
  }

  // HSEQ stats for Nova customers
  let hmsStats = null;
  if (!tenantRes.data?.isTavleOnly && tavle.projectId) {
    const [incidentsRes, actionsRes] = await Promise.all([
      db
        .from("Incident")
        .select("id", { count: "exact", head: true })
        .eq("tenantId", auth.tenantId)
        .eq("projectId", tavle.projectId)
        .neq("status", "CLOSED"),
      db
        .from("Measure")
        .select("id", { count: "exact", head: true })
        .eq("tenantId", auth.tenantId)
        .neq("status", "DONE"),
    ]);
    hmsStats = {
      openIncidents: incidentsRes.count ?? 0,
      openActions: actionsRes.count ?? 0,
    };
  }

  // Team members for assigning guest submissions
  const { data: members } = await db
    .from("UserTenant")
    .select("userId, role, User:userId(name, email)")
    .eq("tenantId", auth.tenantId)
    .in("role", ["ADMIN", "HMS", "LEDER", "VERNEOMBUD"]);

  const teamMembers = (members ?? []).map((m) => {
    const user = (Array.isArray(m.User) ? m.User[0] : m.User) as { name: string | null; email: string | null } | null;
    return {
      id: m.userId as string,
      name: (user?.name ?? user?.email ?? "Unknown") as string,
    };
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hseqnova.co.uk";

  const fullTavle = {
    ...tavle,
    sections: sectionsRes.data ?? [],
    externalLinks: linksRes.data ?? [],
    subcontractorPortal: portalWithSubmissions,
    project,
    checkins: checkinsRes.data ?? [],
    guestSubmissions: guestSubmissionsRes.data ?? [],
  };

  return (
    <TavleAdminClient
      tavle={JSON.parse(JSON.stringify(fullTavle))}
      subscription={JSON.parse(JSON.stringify(subscription))}
      hmsStats={hmsStats}
      canManage={auth.permissions.canManageHmsTavle}
      canReview={auth.permissions.canReviewSubmissions}
      isAddon={subscription.isAddon}
      appUrl={appUrl}
      defaultTab={tab}
      teamMembers={teamMembers}
    />
  );
}
