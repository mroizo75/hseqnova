import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/supabase/admin";
import { TavlePublicDisplay } from "@/features/hms-tavle/components/tavle-public-display";
import { getGuestServiceStats } from "@/features/hms-tavle/lib/gjesteservice-stats";
import { getTavleLiveData } from "@/features/hms-tavle/lib/tavle-live-data";
import { getPlanLimits } from "@/features/hms-tavle/lib/tavle-plan-limits";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ kiosk?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const db = getAdminDb();
  const { data: tavle } = await db
    .from("HmsTavle")
    .select("name, tenantId")
    .eq("publicToken", token)
    .maybeSingle();
  if (!tavle) return { title: "Digital safety board" };

  const { data: tenant } = await db
    .from("Tenant")
    .select("name")
    .eq("id", tavle.tenantId)
    .maybeSingle();

  return {
    title: `${tavle.name} — digital safety board`,
    description: `Site information for ${tenant?.name ?? "this site"}`,
    robots: { index: false },
  };
}

export default async function PublicTavlePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { kiosk } = await searchParams;
  const db = getAdminDb();

  const { data: tavleRow } = await db
    .from("HmsTavle")
    .select("*")
    .eq("publicToken", token)
    .maybeSingle();

  if (!tavleRow) notFound();
  if (!tavleRow.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Board not available</h1>
          <p className="text-muted-foreground mt-2">This board has not been made public.</p>
        </div>
      </div>
    );
  }

  const { data: subscription } = await db
    .from("HmsTavleSubscription")
    .select("*")
    .eq("tenantId", tavleRow.tenantId)
    .maybeSingle();

  if (!subscription || subscription.status === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Subscription expired</h1>
          <p className="text-muted-foreground mt-2">
            The digital safety board subscription has expired. Contact the site manager.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const [
    sectionsRes,
    linksRes,
    portalRes,
    tenantRes,
    checkinsRes,
  ] = await Promise.all([
    db.from("HmsTavleSection").select("*").eq("tavleId", tavleRow.id).eq("isVisible", true).order("order", { ascending: true }),
    db.from("HmsTavleExternalLink").select("*").eq("tavleId", tavleRow.id).order("order", { ascending: true }),
    db.from("SubcontractorPortal").select("portalToken, allowAvvik, allowRuh, allowSja, allowPdfUpload").eq("tavleId", tavleRow.id).maybeSingle(),
    db.from("Tenant").select("name").eq("id", tavleRow.tenantId).maybeSingle(),
    db.from("TavleCheckin").select("id, name, employer, checkedInAt, checkedOutAt, date").eq("tavleId", tavleRow.id).eq("date", today).order("checkedInAt", { ascending: true }),
  ]);

  let project = null;
  if (tavleRow.projectId) {
    const { data: projectData } = await db
      .from("Project")
      .select("name, location")
      .eq("id", tavleRow.projectId)
      .maybeSingle();
    if (projectData) {
      const [shaRes, f10Res] = await Promise.all([
        db.from("ConstructionShaPlan").select("status, availableOnSite, updatedAt").eq("projectId", tavleRow.projectId).maybeSingle(),
        db
          .from("ConstructionPreNotification")
          .select("status, sentAt, expectedStartDate, expectedEndDate, maxWorkersSimultaneous")
          .eq("projectId", tavleRow.projectId)
          .maybeSingle(),
      ]);
      project = {
        ...projectData,
        constructionShaPlan: shaRes.data,
        constructionPreNotification: f10Res.data,
      };
    }
  }

  const sections = sectionsRes.data ?? [];
  const tavle = {
    ...tavleRow,
    sections,
    externalLinks: linksRes.data ?? [],
    subcontractorPortal: portalRes.data,
    tenant: tenantRes.data,
    project,
  };

  const forceKiosk = kiosk === "1";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hseqnova.com";

  const harTillitspanel = sections.some((s) => s.type === "GJESTESERVICE_STATUS");
  const guestStats = harTillitspanel ? await getGuestServiceStats(tavleRow.id) : null;

  const liveData =
    getPlanLimits(subscription.plan).hasLiveHmsNovaData
      ? await getTavleLiveData({
          tenantId: tavleRow.tenantId,
          projectId: tavleRow.projectId,
          sectionTypes: sections.map((s) => s.type),
        })
      : null;

  return (
    <TavlePublicDisplay
      tavle={tavle}
      checkins={checkinsRes.data ?? []}
      plan={subscription.plan}
      publicToken={token}
      forceKiosk={forceKiosk || tavleRow.kioskMode}
      appUrl={appUrl}
      guestStats={guestStats}
      liveData={liveData}
    />
  );
}
