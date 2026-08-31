import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from "@/lib/validations/api";
import { getGuestServiceStats } from "@/features/hms-tavle/lib/gjesteservice-stats";
import { getTavleLiveData } from "@/features/hms-tavle/lib/tavle-live-data";
import { getPlanLimits } from "@/features/hms-tavle/lib/tavle-plan-limits";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const db = getAdminDb();

    const { data: tavleRow } = await db
      .from("HmsTavle")
      .select("*")
      .eq("publicToken", token)
      .maybeSingle();

    if (!tavleRow) return createErrorResponse(ErrorCodes.NOT_FOUND, "Board not found", 404);
    if (!tavleRow.isPublic) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "This board is not public", 403);
    }

    const { data: subscription } = await db
      .from("HmsTavleSubscription")
      .select("*")
      .eq("tenantId", tavleRow.tenantId)
      .maybeSingle();

    if (!subscription || subscription.status === "EXPIRED") {
      return createErrorResponse(
        "SUBSCRIPTION_EXPIRED",
        "The digital safety board subscription has expired",
        402
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const [sectionsRes, linksRes, portalRes, tenantRes, checkinsRes] = await Promise.all([
      db.from("HmsTavleSection").select("*").eq("tavleId", tavleRow.id).eq("isVisible", true).order("order", { ascending: true }),
      db.from("HmsTavleExternalLink").select("*").eq("tavleId", tavleRow.id).order("order", { ascending: true }),
      db.from("SubcontractorPortal").select("portalToken, allowAvvik, allowRuh, allowSja, allowPdfUpload").eq("tavleId", tavleRow.id).maybeSingle(),
      db.from("Tenant").select("name, isTavleOnly").eq("id", tavleRow.tenantId).maybeSingle(),
      subscription.plan !== "ENKEL"
        ? db.from("TavleCheckin").select("id, name, employer, checkedInAt, checkedOutAt").eq("tavleId", tavleRow.id).eq("date", today).order("checkedInAt", { ascending: true })
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
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

    return createSuccessResponse({
      tavle,
      checkins: checkinsRes.data ?? [],
      plan: subscription.plan,
      guestStats,
      liveData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
