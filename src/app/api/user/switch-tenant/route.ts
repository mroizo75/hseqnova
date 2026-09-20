import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { canSwitchToTenant } from "@/lib/external-competent-person";
import { z } from "zod";

const switchTenantSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authorised" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = switchTenantSchema.parse(body);

    const db = getAdminDb();
    const { data: memberships, error } = await db
      .from("UserTenant")
      .select("tenantId, tenant:Tenant(status)")
      .eq("userId", session.user.id);
    if (error) {
      throw { code: "MEMBERSHIP_LOOKUP_FAILED", message: error.message };
    }

    const membershipTenantIds = ((memberships ?? []) as Array<{ tenantId: string }>).map((row) => row.tenantId);
    if (!canSwitchToTenant(membershipTenantIds, tenantId)) {
      return NextResponse.json(
        { error: "You do not have access to this company" },
        { status: 403 },
      );
    }

    const match = (memberships ?? []).find((row) => row.tenantId === tenantId) as
      | { tenantId: string; tenant?: { status?: string } | { status?: string }[] | null }
      | undefined;
    const tenant = Array.isArray(match?.tenant) ? match?.tenant[0] : match?.tenant;
    if (tenant?.status === "CANCELLED" || tenant?.status === "SUSPENDED") {
      return NextResponse.json({ error: "This company is not active" }, { status: 403 });
    }

    await db.from("User").update({ lastTenantId: tenantId }).eq("id", session.user.id);

    return NextResponse.json({ success: true, tenantId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not switch company" }, { status: 500 });
  }
}
