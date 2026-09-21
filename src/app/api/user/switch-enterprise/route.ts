import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const body = (await request.json()) as { enterpriseId?: string };
  if (!body.enterpriseId) {
    return NextResponse.json({ error: "enterpriseId is required" }, { status: 400 });
  }

  const db = getAdminDb();
  const { data } = await db
    .from("EnterpriseUser")
    .select("enterpriseId")
    .eq("userId", session.user.id)
    .eq("enterpriseId", body.enterpriseId)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: "Not a member of this enterprise" }, { status: 403 });
  }

  await db
    .from("User")
    .update({ lastEnterpriseId: body.enterpriseId, updatedAt: new Date().toISOString() })
    .eq("id", session.user.id);

  return NextResponse.json({ ok: true });
}
