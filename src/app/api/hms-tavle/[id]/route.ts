import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getPermissions } from "@/lib/permissions";
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from "@/lib/validations/api";
import { z } from "zod";
import { emitTavleUpdate } from "@/lib/tavle-events";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  kioskMode: z.boolean().optional(),
  logoUrl: z.string().url().optional().nullable(),
  brandColor: z.string().optional().nullable(),
  bransje: z.string().optional().nullable(),
  manualContacts: z.array(z.any()).optional(),
  manualDocuments: z.array(z.any()).optional(),
  siteAddress: z.string().max(255).optional().nullable(),
  clientName: z.string().max(255).optional().nullable(),
  workEndedAt: z.coerce.date().optional().nullable(),
});

async function loadOwnedBoard(id: string, tenantId: string) {
  const { data } = await getAdminDb()
    .from("HmsTavle")
    .select("*")
    .eq("id", id)
    .eq("tenantId", tenantId)
    .maybeSingle();
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);

    const perms = getPermissions(session.user.role);
    if (!perms.canViewHmsTavle) return createErrorResponse(ErrorCodes.FORBIDDEN, "No access", 403);

    const { id } = await params;
    const db = getAdminDb();
    const tavle = await loadOwnedBoard(id, session.user.tenantId);
    if (!tavle) return createErrorResponse(ErrorCodes.NOT_FOUND, "Board not found", 404);

    const today = new Date().toISOString().slice(0, 10);
    const [sectionsRes, linksRes, portalRes, checkinsRes] = await Promise.all([
      db.from("HmsTavleSection").select("*").eq("tavleId", id).order("order", { ascending: true }),
      db.from("HmsTavleExternalLink").select("*").eq("tavleId", id).order("order", { ascending: true }),
      db.from("SubcontractorPortal").select("*").eq("tavleId", id).maybeSingle(),
      db.from("TavleCheckin").select("*").eq("tavleId", id).eq("date", today).order("checkedInAt", { ascending: true }),
    ]);

    let portal = portalRes.data;
    if (portal) {
      const { data: submissions } = await db
        .from("SubcontractorSubmission")
        .select("*")
        .eq("portalId", portal.id)
        .order("createdAt", { ascending: false })
        .limit(50);
      portal = { ...portal, submissions: submissions ?? [] };
    }

    let project = null;
    if (tavle.projectId) {
      const { data: projectData } = await db.from("Project").select("*").eq("id", tavle.projectId).maybeSingle();
      if (projectData) {
        const [shaRes, f10Res, rosterRes] = await Promise.all([
          db.from("ConstructionShaPlan").select("status, updatedAt").eq("projectId", tavle.projectId).maybeSingle(),
          db.from("ConstructionPreNotification").select("status, sentAt").eq("projectId", tavle.projectId).maybeSingle(),
          db.from("ConstructionRosterEntry").select("*").eq("projectId", tavle.projectId).order("createdAt", { ascending: false }).limit(100),
        ]);
        project = {
          ...projectData,
          constructionShaPlan: shaRes.data,
          constructionPreNotification: f10Res.data,
          constructionRosterEntries: rosterRes.data ?? [],
        };
      }
    }

    return createSuccessResponse({
      ...tavle,
      sections: sectionsRes.data ?? [],
      externalLinks: linksRes.data ?? [],
      subcontractorPortal: portal,
      checkins: checkinsRes.data ?? [],
      project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);

    const perms = getPermissions(session.user.role);
    if (!perms.canManageHmsTavle) return createErrorResponse(ErrorCodes.FORBIDDEN, "No access", 403);

    const { id } = await params;
    const existing = await loadOwnedBoard(id, session.user.tenantId);
    if (!existing) return createErrorResponse(ErrorCodes.NOT_FOUND, "Board not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse(ErrorCodes.VALIDATION_ERROR, parsed.error.issues[0].message, 400);

    const payload: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.workEndedAt instanceof Date) {
      payload.workEndedAt = parsed.data.workEndedAt.toISOString();
    }

    const { data: tavle, error } = await getAdminDb()
      .from("HmsTavle")
      .update(payload)
      .eq("id", id)
      .eq("tenantId", session.user.tenantId)
      .select("*")
      .single();

    if (error) {
      throw { code: "TAVLE_UPDATE_FAILED", message: error.message };
    }

    emitTavleUpdate(tavle.publicToken);

    return createSuccessResponse(tavle);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);

    const perms = getPermissions(session.user.role);
    if (!perms.canManageHmsTavle) return createErrorResponse(ErrorCodes.FORBIDDEN, "No access", 403);

    const { id } = await params;
    const existing = await loadOwnedBoard(id, session.user.tenantId);
    if (!existing) return createErrorResponse(ErrorCodes.NOT_FOUND, "Board not found", 404);

    const { error } = await getAdminDb().from("HmsTavle").delete().eq("id", id).eq("tenantId", session.user.tenantId);
    if (error) {
      throw { code: "TAVLE_DELETE_FAILED", message: error.message };
    }

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
