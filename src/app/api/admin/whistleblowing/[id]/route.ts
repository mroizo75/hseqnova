import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { createNotification } from "@/server/actions/notification.actions";
import { withAuditLog } from "@/lib/audit-log";
import {
  loadWhistleblowingDetail,
  updateWhistleblowingReport,
} from "@/server/queries/whistleblowing.queries";

export const dynamic = "force-dynamic";

const updateWhistleblowSchema = z.object({
  status: z
    .enum([
      "RECEIVED",
      "ACKNOWLEDGED",
      "UNDER_INVESTIGATION",
      "ACTION_TAKEN",
      "RESOLVED",
      "CLOSED",
      "DISMISSED",
    ])
    .optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedTo: z.string().nullable().optional(),
  investigationNotes: z.string().optional(),
  actions: z.array(z.any()).optional(),
  outcome: z.string().optional(),
  closedReason: z.string().optional(),
});

/** GET /api/admin/whistleblowing/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "HMS"];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = await loadWhistleblowingDetail(session.user.tenantId, id);

    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: report });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH /api/admin/whistleblowing/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "HMS"];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = updateWhistleblowSchema.parse(body);

    const existing = await loadWhistleblowingDetail(session.user.tenantId, id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...validatedData };

    if (validatedData.actions !== undefined) {
      updateData.actions = JSON.stringify(validatedData.actions);
    }

    if (validatedData.status === "ACKNOWLEDGED" && !existing.acknowledgedAt) {
      updateData.acknowledgedAt = new Date().toISOString();
      updateData.handledBy = session.user.id;
    }
    if (validatedData.status === "UNDER_INVESTIGATION" && !existing.investigatedAt) {
      updateData.investigatedAt = new Date().toISOString();
    }
    if (
      (validatedData.status === "RESOLVED" ||
        validatedData.status === "CLOSED" ||
        validatedData.status === "DISMISSED") &&
      !existing.closedAt
    ) {
      updateData.closedAt = new Date().toISOString();
    }

    updateData.updatedById = session.user.id;

    const report = await updateWhistleblowingReport({
      id,
      tenantId: session.user.tenantId,
      patch: updateData,
    });
    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await withAuditLog(
      session.user.tenantId,
      session.user.id,
      "whistleblowing",
      id,
      "UPDATE",
      { status: validatedData.status, severity: validatedData.severity },
    );

    const newAssignee = validatedData.assignedTo;
    if (
      newAssignee &&
      newAssignee !== existing.assignedTo &&
      newAssignee !== session.user.id
    ) {
      createNotification({
        tenantId: session.user.tenantId,
        userId: newAssignee,
        type: "WHISTLEBLOWING",
        title: "Whistleblowing case assigned to you",
        message: `Case ${existing.caseNumber}: ${existing.title} has been assigned to you.`,
        link: `/dashboard/whistleblowing/${id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
