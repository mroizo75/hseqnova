import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { createSjaAnalysis, getSjaAnalyses } from "@/server/actions/sja.actions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.tenantId) {
      return NextResponse.json({ error: "No organisation access" }, { status: 403 });
    }

    const result = await getSjaAnalyses(session.user.tenantId);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Could not load RAMS" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load RAMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await createSjaAnalysis(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Could not create RAMS" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not create RAMS";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
