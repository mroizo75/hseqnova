import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { createNotification } from "@/server/actions/notification.actions";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  caseNumber: z.string().min(1),
  accessCode: z.string().min(1),
  message: z.string().min(1),
});

/** POST /api/whistleblowing/[id]/messages — reporter adds a follow-up message */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { caseNumber, accessCode, message } = messageSchema.parse(body);

    const report = await prisma.whistleblowing.findFirst({
      where: { id, caseNumber, accessCode },
    });

    if (!report) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newMessage = await prisma.whistleblowMessage.create({
      data: {
        whistleblowingId: id,
        sender: "REPORTER",
        message,
      },
    });

    const notifyUserId = report.assignedTo || report.handledBy;
    if (notifyUserId) {
      createNotification({
        tenantId: report.tenantId,
        userId: notifyUserId,
        type: "WHISTLEBLOWING_MSG",
        title: "New message from whistleblower",
        message: `The reporter has sent a new message on case ${report.caseNumber}.`,
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
