import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getStorage, generateFileKey } from "@/lib/storage";
import { createId } from "@/lib/ids";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const db = getAdminDb();

    const { data: incident } = await db
      .from("Incident")
      .select("id")
      .eq("id", id)
      .eq("tenantId", tenantId)
      .maybeSingle();

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const images = formData.getAll("images") as File[];
    const storage = getStorage();
    const created: string[] = [];

    for (const image of images) {
      if (!image || image.size === 0) continue;
      const fileKey = generateFileKey(tenantId, "incidents", image.name);
      await storage.upload(fileKey, image);
      await db.from("Attachment").insert({
        id: createId(),
        tenantId,
        incidentId: id,
        fileKey,
        name: image.name,
        mime: image.type,
        size: image.size,
      });
      created.push(fileKey);
    }

    return NextResponse.json({ success: true, count: created.length }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not upload images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
