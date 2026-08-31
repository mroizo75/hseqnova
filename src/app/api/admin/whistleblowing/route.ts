import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadWhistleblowingList } from "@/server/queries/whistleblowing.queries";

export const dynamic = "force-dynamic";

/** GET /api/admin/whistleblowing — list all reports for tenant (admin/HMS only) */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "HMS"];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reports = await loadWhistleblowingList(session.user.tenantId);
    return NextResponse.json({ data: reports });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
