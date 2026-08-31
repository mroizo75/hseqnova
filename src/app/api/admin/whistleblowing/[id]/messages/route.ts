import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { createNotification } from "@/server/actions/notification.actions";
import {
  createWhistleblowMessage,
  loadWhistleblowingDetail,
} from "@/server/queries/whistleblowing.queries";

export const dynamic = "force-dynamic";

const adminMessageSchema = z.object({
  message: z.string().min(1),
  isInternal: z.boolean().default(false),
});

/** POST /api/admin/whistleblowing/[id]/messages — admin adds a message */
export async function POST(
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
    const { message, isInternal } = adminMessageSchema.parse(body);

    const report = await loadWhistleblowingDetail(session.user.tenantId, id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const newMessage = await createWhistleblowMessage({
      whistleblowingId: id,
      sender: "HANDLER",
      senderUserId: session.user.id,
      message,
      isInternal,
    });

    if (report.assignedTo && report.assignedTo !== session.user.id) {
      createNotification({
        tenantId: session.user.tenantId,
        userId: report.assignedTo,
        type: "WHISTLEBLOWING_MSG",
        title: "New message in whistleblowing case",
        message: `A new ${isInternal ? "internal note" : "message"} was added to case ${report.caseNumber}.`,
        link: `/dashboard/whistleblowing/${id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ data: newMessage }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
