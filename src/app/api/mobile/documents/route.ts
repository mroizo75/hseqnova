import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-authorization";
import { loadPublishedDocumentsForRole } from "@/server/queries/documents.queries";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Not authorised." }, { status: 401 });
    }

    if (!auth.permissions.canReadDocuments) {
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    const documents = await loadPublishedDocumentsForRole(auth.tenantId, auth.role);
    return NextResponse.json(
      {
        documents: documents.map((document) => ({
          id: document.id,
          title: document.title,
          kind: document.kind,
          status: document.status,
          visibleToRoles: document.visibleToRoles,
          updatedAt: document.updatedAt,
        })),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Could not load documents." }, { status: 500 });
  }
}
