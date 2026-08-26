import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 });
    }

    const { tenantId } = await params;
    const db = getAdminDb();
    const { data: membership } = await db
      .from("UserTenant")
      .select("userId")
      .eq("userId", session.user.id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "You do not have access to this company." },
        { status: 403 },
      );
    }

    const { data: memberships, error: membershipError } = await db
      .from("UserTenant")
      .select("userId")
      .eq("tenantId", tenantId);
    if (membershipError) {
      throw { code: "MEMBERSHIP_LIST_FAILED", message: membershipError.message };
    }

    const userIds = [...new Set((memberships ?? []).map((row) => row.userId as string))];
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    const { data: users, error: usersError } = await db
      .from("User")
      .select("id, name, email")
      .in("id", userIds);
    if (usersError) {
      throw { code: "USER_LIST_FAILED", message: usersError.message };
    }

    const sorted = [...(users ?? [])].sort((a, b) => {
      const left = String(a.name || a.email || "");
      const right = String(b.name || b.email || "");
      return left.localeCompare(right, "en-GB");
    });

    return NextResponse.json({
      success: true,
      users: sorted.map((user) => ({
        user: {
          id: user.id as string,
          name: (user.name as string | null) ?? null,
          email: user.email as string,
        },
      })),
    });
  } catch (error: unknown) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message: string }).message)
        : "Could not load users";
    return NextResponse.json({ code: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
