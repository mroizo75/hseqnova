import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { getSjaTemplates } from "@/server/actions/sja.actions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.tenantId) {
      return NextResponse.json({ error: "No organisation access" }, { status: 403 });
    }

    const result = await getSjaTemplates(session.user.tenantId);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Could not load RAMS templates" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load RAMS templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
