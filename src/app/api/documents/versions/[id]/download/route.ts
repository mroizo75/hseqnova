import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getStorage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authorised." }, { status: 401 });
    }

    const { data: version } = await getAdminDb()
      .from("DocumentVersion")
      .select("fileKey, documentId")
      .eq("id", id)
      .maybeSingle();

    if (!version) {
      return NextResponse.json({ error: "Document version not found." }, { status: 404 });
    }

    const { data: document } = await getAdminDb()
      .from("Document")
      .select("tenantId")
      .eq("id", version.documentId)
      .maybeSingle();

    if (!document || document.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Document version not found." }, { status: 404 });
    }

    const storage = getStorage();
    const signedUrl = await storage.getUrl(version.fileKey, 3600);
    return NextResponse.redirect(signedUrl);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return NextResponse.json(
      {
        code: err.code || "DOCUMENT_VERSION_DOWNLOAD_FAILED",
        message: err.message || "Could not download the document version.",
      },
      { status: 500 }
    );
  }
}
