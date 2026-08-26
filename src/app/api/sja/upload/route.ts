import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getStorage, generateFileKey } from "@/lib/storage";
import { insertSjaAttachment, loadSjaById } from "@/server/queries/sja.queries";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const tenantId = session.user.tenantId;
    const sjaAnalysisId = formData.get("sjaAnalysisId") as string;

    if (!tenantId || !sjaAnalysisId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const analysis = await loadSjaById(sjaAnalysisId, tenantId);
    if (!analysis) {
      return NextResponse.json({ error: "RAMS not found" }, { status: 404 });
    }

    const images = formData.getAll("images") as File[];
    const storage = getStorage();
    const uploaded: string[] = [];

    for (const image of images) {
      if (image && image.size > 0) {
        const fileKey = generateFileKey(tenantId, `sja/${sjaAnalysisId}`, image.name);
        await storage.upload(fileKey, image);
        await insertSjaAttachment({
          tenantId,
          sjaAnalysisId,
          fileKey,
          name: image.name,
          mime: image.type,
          size: image.size,
        });
        uploaded.push(fileKey);
      }
    }

    return NextResponse.json({ success: true, count: uploaded.length }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not upload files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
