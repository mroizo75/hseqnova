import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { nanoid } from "nanoid";
import { strictRateLimiter, getClientIp } from "@/lib/rate-limit";
import { notifyUsersByRole } from "@/server/actions/notification.actions";
import { withAuditLog } from "@/lib/audit-log";

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

    const tenant = await prisma.tenant.findFirst({
      where: {
        id: validatedData.tenantId,
        slug: validatedData.tenantSlug,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Invalid reporting channel" }, { status: 403 });
    }

    const count = await prisma.whistleblowing.count({
      where: { tenantId: tenant.id },
    });
    const year = new Date().getFullYear();
    const caseNumber = `WB-${year}-${String(count + 1).padStart(3, "0")}`;

    const accessCode = nanoid(16).toUpperCase();

    const report = await prisma.whistleblowing.create({
      data: {
        tenantId: tenant.id,
        caseNumber,
        accessCode,
        category: validatedData.category,
        title: validatedData.title,
        description: validatedData.description,
        occurredAt: validatedData.occurredAt ? new Date(validatedData.occurredAt) : null,
        location: validatedData.location || null,
        involvedPersons: validatedData.involvedPersons || null,
        witnesses: validatedData.witnesses || null,
        reporterName: validatedData.reporterName || null,
        reporterEmail: validatedData.reporterEmail || null,
        reporterPhone: validatedData.reporterPhone || null,
        isAnonymous: validatedData.isAnonymous,
      },
    });

    await prisma.whistleblowMessage.create({
      data: {
        whistleblowingId: report.id,
        sender: "SYSTEM",
        message: `Report received with case number ${caseNumber}. Use your access code to follow up.`,
      },
    });

    await withAuditLog(
      tenant.id,
      "anonymous",
      "whistleblowing",
      report.id,
      "CREATE",
      { caseNumber, category: report.category },
    );

    await notifyUsersByRole(tenant.id, "HMS", {
      type: "WHISTLEBLOWING",
      title: "New whistleblowing report received",
      message: `${report.category}: ${report.title} — Case: ${caseNumber}`,
      link: `/dashboard/whistleblowing/${report.id}`,
    });

    await notifyUsersByRole(tenant.id, "LEDER", {
      type: "WHISTLEBLOWING",
      title: "New whistleblowing report received",
      message: `${report.category}: ${report.title} — Case: ${caseNumber}`,
      link: `/dashboard/whistleblowing/${report.id}`,
    });

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
