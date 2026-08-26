import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { resolveTenantId } from "@/lib/membership";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 20;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const tenantId = await resolveTenantId(session.user.id, session.user.tenantId);
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const db = getAdminDb();
    let query = db
      .from("Notification")
      .select("*")
      .eq("userId", session.user.id)
      .eq("tenantId", tenantId)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("isRead", false);
    }

    const { data: notifications, error } = await query;
    if (error) {
      throw { code: "NOTIFICATION_LOOKUP_FAILED", message: error.message };
    }

    const { count, error: countError } = await db
      .from("Notification")
      .select("id", { count: "exact", head: true })
      .eq("userId", session.user.id)
      .eq("tenantId", tenantId)
      .eq("isRead", false);

    if (countError) {
      throw { code: "NOTIFICATION_COUNT_FAILED", message: countError.message };
    }

    return NextResponse.json({ notifications: notifications ?? [], unreadCount: count ?? 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    console.error("GET notifications error:", error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    const tenantId = await resolveTenantId(session.user.id, session.user.tenantId);
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const db = getAdminDb();

    if (markAll) {
      await db
        .from("Notification")
        .update({ isRead: true, readAt: new Date().toISOString() })
        .eq("userId", session.user.id)
        .eq("tenantId", tenantId)
        .eq("isRead", false);

      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      const { data: notification } = await db
        .from("Notification")
        .select("id")
        .eq("id", notificationId)
        .eq("userId", session.user.id)
        .eq("tenantId", tenantId)
        .maybeSingle();

      if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      await db
        .from("Notification")
        .update({ isRead: true, readAt: new Date().toISOString() })
        .eq("id", notificationId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    console.error("PATCH notifications error:", error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
    }

    const tenantId = await resolveTenantId(session.user.id, session.user.tenantId);
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const db = getAdminDb();
    const { data: notification } = await db
      .from("Notification")
      .select("id")
      .eq("id", notificationId)
      .eq("userId", session.user.id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    await db.from("Notification").delete().eq("id", notificationId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message;
    console.error("DELETE notification error:", error);
    return NextResponse.json({ error: message || "Internal server error" }, { status: 500 });
  }
}
