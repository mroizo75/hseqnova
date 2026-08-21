import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/whistleblowing - List all reports for tenant (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HMS roles can view whistleblowing reports
    const allowedRoles = ["ADMIN", "HMS"];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await db.whistleblowing.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { receivedAt: "desc" },
    });

    return NextResponse.json({ data: reports });
  } catch (error: any) {
    console.error("[ADMIN_WHISTLEBLOWING_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

