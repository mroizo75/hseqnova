import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { AuditLog } from "@/lib/audit-log";
import { getClientIp } from "@/lib/rate-limit";
import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  ErrorCodes,
} from "@/lib/validations/api";
import { buildOversiktslisteCsv } from "@/features/hms-tavle/lib/oversiktsliste-config";

/**
 * Operational site register export.
 * Not a CDM 2015 duty. History and CSV for the host’s own records.
 */

const ISO_DATO = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  from: z.string().regex(ISO_DATO).optional(),
  to: z.string().regex(ISO_DATO).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

const MAX_RADER = 5000;

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  return new Date(String(value));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated", 401);
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      format: searchParams.get("format") ?? undefined,
    });

    if (!parsed.success) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid date filter", 400);
    }

    const db = getAdminDb();
    const { data: tavle } = await db
      .from("HmsTavle")
      .select("id, name, siteAddress, clientName, workEndedAt, projectId")
      .eq("id", id)
      .eq("tenantId", session.user.tenantId)
      .maybeSingle();
    if (!tavle) return createErrorResponse(ErrorCodes.NOT_FOUND, "Board not found", 404);

    let project: { name: string; location: string | null; clientName: string | null; endDate: string | null } | null = null;
    if (tavle.projectId) {
      const { data } = await db
        .from("Project")
        .select("name, location, clientName, endDate")
        .eq("id", tavle.projectId)
        .maybeSingle();
      project = data;
    }

    const { from, to, format } = parsed.data;
    let checkinQuery = getAdminDb()
      .from("TavleCheckin")
      .select("*")
      .eq("tavleId", id);
    if (from) checkinQuery = checkinQuery.gte("date", from);
    if (to) checkinQuery = checkinQuery.lte("date", to);
    const { data: checkinRows } = await checkinQuery
      .order("date", { ascending: false })
      .order("checkedInAt", { ascending: true })
      .limit(MAX_RADER);

    const checkins = (checkinRows ?? []).map((row) => ({
      ...row,
      checkedInAt: asDate(row.checkedInAt),
      checkedOutAt: row.checkedOutAt ? asDate(row.checkedOutAt) : null,
    }));

    const kontekst = {
      siteName: project?.name ?? tavle.name,
      siteAddress: tavle.siteAddress ?? project?.location ?? null,
      clientName: tavle.clientName ?? project?.clientName ?? null,
    };

    if (format === "json") {
      return createSuccessResponse({
        checkins,
        truncated: checkins.length === MAX_RADER,
        site: kontekst,
        workEndedAt: tavle.workEndedAt ?? project?.endDate ?? null,
      });
    }

    const csv = buildOversiktslisteCsv(checkins, kontekst);

    await AuditLog.log(
      session.user.tenantId,
      session.user.id,
      "TAVLE_OVERSIKTSLISTE_EXPORTED",
      "HmsTavle",
      id,
      { rowCount: checkins.length, from: from ?? null, to: to ?? null },
      getClientIp(req),
      req.headers.get("user-agent") ?? undefined
    );

    const filnavn = `site-register-${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filnavn}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
