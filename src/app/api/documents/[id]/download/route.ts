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

    const { data: document } = await getAdminDb()
      .from("Document")
      .select("fileKey")
      .eq("id", id)
      .eq("tenantId", session.user.tenantId)
      .maybeSingle();

    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const storage = getStorage();
    const signedUrl = await storage.getUrl(document.fileKey, 3600);
    return NextResponse.redirect(signedUrl);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return NextResponse.json(
      { code: err.code || "DOCUMENT_DOWNLOAD_FAILED", message: err.message || "Could not download the document." },
      { status: 500 }
    );
  }
}
