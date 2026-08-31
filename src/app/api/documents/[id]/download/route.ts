import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-authorization";
import { getStorage } from "@/lib/storage";
import { loadDocumentById } from "@/server/queries/documents.queries";
import { mayOpenDocumentFile } from "@/lib/document-uk";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();

    if (!auth) {
      return NextResponse.json({ error: "Not authorised." }, { status: 401 });
    }

    const document = await loadDocumentById({ id, tenantId: auth.tenantId });
    if (
      !document ||
      !mayOpenDocumentFile({
        status: document.status,
        visibleToRoles: document.visibleToRoles,
        effectiveTo: document.effectiveTo,
        role: auth.role,
        canCreateDocuments: auth.permissions.canCreateDocuments,
        canApproveDocuments: auth.permissions.canApproveDocuments,
      })
    ) {
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
