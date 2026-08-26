import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Plus,
  QrCode,
  Users,
  Eye,
  Settings,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { PLAN_LABELS } from "@/features/hms-tavle/lib/tavle-plan-limits";
import { ActivateTavleAddonButton } from "@/features/hms-tavle/components/activate-addon-button";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "CANCELLED";

function statusBadge(status: SubscriptionStatus) {
  const map: Record<SubscriptionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    TRIAL: { label: "Trial", variant: "secondary" },
    ACTIVE: { label: "Active", variant: "default" },
    EXPIRING_SOON: { label: "Expires soon", variant: "outline" },
    EXPIRED: { label: "Expired", variant: "destructive" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default async function HmsTavleOversiktPage() {
  const auth = await getAuthContext();
  if (!auth.permissions.canViewHmsTavle) redirect("/dashboard");

  const db = getAdminDb();

  const [tavlerRes, subscriptionRes, tenantRes] = await Promise.all([
    db
      .from("HmsTavle")
      .select("id, name, isPublic, publicToken, brandColor, createdAt, projectId, Project:projectId(id, name)")
      .eq("tenantId", auth.tenantId)
      .order("createdAt", { ascending: false }),
    db
      .from("HmsTavleSubscription")
      .select("*")
      .eq("tenantId", auth.tenantId)
      .maybeSingle(),
    db
      .from("Tenant")
      .select("isTavleOnly, name")
      .eq("id", auth.tenantId)
      .maybeSingle(),
  ]);

  const tavler = tavlerRes.data ?? [];
  const subscription = subscriptionRes.data;

  const hasActiveSub =
    subscription &&
    subscription.status !== "EXPIRED" &&
    subscription.status !== "CANCELLED";

  const today = new Date().toISOString().slice(0, 10);
  const tavleIds = tavler.map((t) => t.id);
  let todayCheckins = 0;
  if (tavleIds.length > 0) {
    const { count } = await db
      .from("TavleCheckin")
      .select("id", { count: "exact", head: true })
      .in("tavleId", tavleIds)
      .eq("date", today);
    todayCheckins = count ?? 0;
  }

  // Fetch sections and checkin counts per tavle
  const [sectionsRes, checkinsRes, portalRes] = await Promise.all([
    tavleIds.length > 0
      ? db.from("HmsTavleSection").select("id, tavleId, type, isVisible").in("tavleId", tavleIds)
      : Promise.resolve({ data: [] as { id: string; tavleId: string; type: string; isVisible: boolean }[] }),
    tavleIds.length > 0
      ? db.from("TavleCheckin").select("tavleId").in("tavleId", tavleIds)
      : Promise.resolve({ data: [] as { tavleId: string }[] }),
    tavleIds.length > 0
      ? db.from("SubcontractorPortal").select("id, tavleId, portalToken").in("tavleId", tavleIds)
      : Promise.resolve({ data: [] as { id: string; tavleId: string; portalToken: string }[] }),
  ]);

  const sections = sectionsRes.data ?? [];
  const checkins = checkinsRes.data ?? [];
  const portals = portalRes.data ?? [];

  const sectionsByTavle = new Map<string, typeof sections>();
  for (const s of sections) {
    const arr = sectionsByTavle.get(s.tavleId) ?? [];
    arr.push(s);
    sectionsByTavle.set(s.tavleId, arr);
  }

  const checkinCountByTavle = new Map<string, number>();
  for (const c of checkins) {
    checkinCountByTavle.set(c.tavleId, (checkinCountByTavle.get(c.tavleId) ?? 0) + 1);
  }

  const portalByTavle = new Map<string, (typeof portals)[0]>();
  for (const p of portals) {
    portalByTavle.set(p.tavleId, p);
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6 text-blue-600" />
            Digital safety board
          </h1>
          <p className="text-muted-foreground mt-1">
            Digital site safety board for construction — QR access, subcontractor portal and live HSEQ data
          </p>
        </div>
        {hasActiveSub && auth.permissions.canManageHmsTavle && (
          <Button asChild>
            <Link href="/dashboard/hms-tavle/ny">
              <Plus className="h-4 w-4 mr-2" />
              New board
            </Link>
          </Button>
        )}
      </div>

      {subscription ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Subscription</p>
                  <p className="font-semibold">{PLAN_LABELS[subscription.plan as keyof typeof PLAN_LABELS]}</p>
                </div>
                {statusBadge(subscription.status as SubscriptionStatus)}
                {subscription.isAddon && (
                  <Badge variant="outline" className="text-xs">
                    HSEQ Nova add-on
                  </Badge>
                )}
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">{tavler.length}</span> board(s)
                </span>
                <span>
                  <span className="font-medium text-foreground">{todayCheckins}</span> check-ins today
                </span>
                <span>
                  Renews{" "}
                  <span className="font-medium text-foreground">
                    {new Date(subscription.endsAt).toLocaleDateString("en-GB")}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-4">
            <Monitor className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No safety board subscription</h3>
              <p className="text-muted-foreground mt-1">
                Activate Digital safety board as an add-on to your existing HSEQ Nova subscription,
                or register for board-only access.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              {auth.permissions.canManageHmsTavle && <ActivateTavleAddonButton />}
              <Button variant="outline" asChild>
                <Link href="/tavle-registrering">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Board-only subscription
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveSub && (
        <>
          {tavler.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center space-y-4">
                <Monitor className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">No boards created yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Create your first digital safety board for a project or construction site.
                  </p>
                </div>
                {auth.permissions.canManageHmsTavle && (
                  <Button asChild>
                    <Link href="/dashboard/hms-tavle/ny">
                      <Plus className="h-4 w-4 mr-2" />
                      Create first board
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tavler.map((tavle) => {
                const tavleSections = sectionsByTavle.get(tavle.id) ?? [];
                const checkinCount = checkinCountByTavle.get(tavle.id) ?? 0;
                const portal = portalByTavle.get(tavle.id);
                const projectRaw = tavle.Project as unknown;
                const project = Array.isArray(projectRaw) ? (projectRaw[0] as { id: string; name: string } | undefined) ?? null : (projectRaw as { id: string; name: string } | null);

                return (
                  <Card key={tavle.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: (tavle.brandColor as string) ?? "#2563eb" }}
                          />
                          <CardTitle className="text-base">{tavle.name}</CardTitle>
                        </div>
                        <Badge variant={tavle.isPublic ? "default" : "secondary"} className="text-xs">
                          {tavle.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      {project && (
                        <p className="text-xs text-muted-foreground">
                          Project: {project.name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3.5 w-3.5" />
                          {tavleSections.filter((s) => s.isVisible).length} sections
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {checkinCount} check-ins
                        </span>
                        {portal && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Subcontractor portal
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/hms-tavle/${tavle.id}`}>
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Manage
                          </Link>
                        </Button>
                        {tavle.isPublic && (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={`/tavle/${tavle.publicToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View board
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/hms-tavle/${tavle.id}?tab=qr`}>
                            <QrCode className="h-3.5 w-3.5 mr-1" />
                            QR code
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {!subscription && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Monitor,
              title: "Simple – £30/month",
              desc: "Contact details, CDM 2015 link, document hub. Ideal for simple projects.",
            },
            {
              icon: QrCode,
              title: "Standard – £45/month",
              desc: "All sections, subcontractor portal for submissions without an account, QR check-in.",
            },
            {
              icon: CheckCircle2,
              title: "Advanced – £60/month",
              desc: "Kiosk mode, AI insight, legal checklist, unlimited boards.",
            },
          ].map((plan) => (
            <Card key={plan.title}>
              <CardContent className="p-5 space-y-2">
                <plan.icon className="h-8 w-8 text-blue-600" />
                <p className="font-semibold">{plan.title}</p>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
