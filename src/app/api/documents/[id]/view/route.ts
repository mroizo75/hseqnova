import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-authorization";
import { getStorage } from "@/lib/storage";
import { convertDocumentToPDF } from "@/lib/adobe-pdf";
import { loadDocumentById } from "@/server/queries/documents.queries";
import { mayOpenDocumentFile } from "@/lib/document-uk";

const DOCX_MIMES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

/**
 * Stream the current working copy as PDF.
 * Employees only receive the approved copy (MHSWR 1999 reg.10; HSG65).
 */
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
    let pdfBuffer: Buffer;

    if (document.mime === "application/pdf") {
      const buffer = await storage.get(document.fileKey);
      if (!buffer) {
        return NextResponse.json(
          { error: "Could not load the document file." },
          { status: 500 }
        );
      }
      pdfBuffer = buffer;
    } else if (DOCX_MIMES.includes(document.mime)) {
      const cacheKey = `${auth.tenantId}/documents/pdf/${id}.pdf`;
      const cached = await storage.get(cacheKey);

      if (cached) {
        pdfBuffer = cached;
      } else {
        const docBuffer = await storage.get(document.fileKey);
        if (!docBuffer) {
          return NextResponse.json(
            { error: "Could not load the document file." },
            { status: 500 }
          );
        }

        try {
          pdfBuffer = await convertDocumentToPDF(docBuffer, document.mime);
        } catch {
          return NextResponse.json(
            { error: "Could not convert the document to PDF." },
            { status: 502 }
          );
        }

        await storage.upload(cacheKey, pdfBuffer, {
          "Content-Type": "application/pdf",
        });
      }
    } else {
      return NextResponse.json(
        { error: "This format cannot be previewed in the browser. Download the file instead." },
        { status: 400 }
      );
    }

    const filename = document.title.replace(/[^a-zA-Z0-9æøåÆØÅ._\s-]/g, "_") + ".pdf";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    return NextResponse.json(
      { code: err.code || "DOCUMENT_VIEW_FAILED", message: err.message || "Could not display the document." },
      { status: 500 }
    );
  }
}
