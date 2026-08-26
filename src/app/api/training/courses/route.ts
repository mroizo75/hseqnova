import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { loadCourseTemplatesForTenant } from "@/server/queries/training.queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "User not associated with organisation" }, { status: 403 });
    }

    const courses = await loadCourseTemplatesForTenant(tenantId, { activeOnly: false });
    courses.sort((a, b) => {
      if (a.isGlobal !== b.isGlobal) return a.isGlobal ? -1 : 1;
      return a.title.localeCompare(b.title, "en");
    });

    return NextResponse.json({ courses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch courses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
