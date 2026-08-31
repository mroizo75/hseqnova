import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { notifyUsersByRole } from "@/server/actions/notification.actions";
import { withAuditLog } from "@/lib/audit-log";
import { getAdminDb } from "@/lib/supabase/admin";
import { createWhistleblowingReport } from "@/server/queries/whistleblowing.queries";

export const dynamic = "force-dynamic";

const createWhistleblowSchema = z.object({
  tenantId: z.string().min(1),
  tenantSlug: z.string().min(1),
  category: z.enum([
    "HARASSMENT",
    "DISCRIMINATION",
    "WORK_ENVIRONMENT",
    "SAFETY",
    "CORRUPTION",
    "ETHICS",
    "LEGAL",
    "OTHER",
  ]),
  title: z.string().min(1),
  description: z.string().min(10),
  occurredAt: z.string().datetime().optional(),
  location: z.string().optional(),
  involvedPersons: z.string().optional(),
  witnesses: z.string().optional(),
  reporterName: z.string().optional(),
  reporterEmail: z.string().email().optional(),
  reporterPhone: z.string().optional(),
  isAnonymous: z.boolean().default(true),
  _hp: z.string().optional(),
});

/** POST /api/whistleblowing — submit a whistleblowing report (PIDA 1998) */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimitResult = await strictRateLimiter.limit(`whistleblow:${ip}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait before submitting another report." },
        { status: 429 },
      );
    }

    const body = await req.json();

    if (body._hp && body._hp.trim() !== "") {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    const validatedData = createWhistleblowSchema.parse(body);

    const { data: tenant } = await getAdminDb()
      .from("Tenant")
      .select("id")
      .eq("id", validatedData.tenantId)
      .eq("slug", validatedData.tenantSlug)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!tenant) {
      return NextResponse.json({ error: "Invalid reporting channel" }, { status: 403 });
    }

    const accessCode = nanoid(16).toUpperCase();
    const report = await createWhistleblowingReport({
      tenantId: tenant.id as string,
      accessCode,
      category: validatedData.category,
      title: validatedData.title,
      description: validatedData.description,
      occurredAt: validatedData.occurredAt ?? null,
      location: validatedData.location || null,
      involvedPersons: validatedData.involvedPersons || null,
      witnesses: validatedData.witnesses || null,
      reporterName: validatedData.reporterName || null,
      reporterEmail: validatedData.reporterEmail || null,
      reporterPhone: validatedData.reporterPhone || null,
      isAnonymous: validatedData.isAnonymous,
    });

    await withAuditLog(
      tenant.id as string,
      "anonymous",
      "whistleblowing",
      report.id,
      "CREATE",
      { caseNumber: report.caseNumber, category: report.category },
    );

    try {
      await notifyUsersByRole(tenant.id as string, "HMS", {
        type: "WHISTLEBLOWING",
        title: "New whistleblowing report received",
        message: `${report.category}: ${report.title} — Case: ${report.caseNumber}`,
        link: `/dashboard/whistleblowing/${report.id}`,
      });
      await notifyUsersByRole(tenant.id as string, "ADMIN", {
        type: "WHISTLEBLOWING",
        title: "New whistleblowing report received",
        message: `${report.category}: ${report.title} — Case: ${report.caseNumber}`,
        link: `/dashboard/whistleblowing/${report.id}`,
      });
    } catch {
      /* Notifications still use Prisma; the report is already stored. */
    }

    return NextResponse.json(
      {
        data: {
          id: report.id,
          caseNumber: report.caseNumber,
          accessCode: report.accessCode,
        },
        message: "Report received. Please note your case number and access code for follow-up.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
