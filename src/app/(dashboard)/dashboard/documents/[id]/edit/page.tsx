import { getAuthContext } from "@/lib/server-authorization";
import { redirect } from "next/navigation";
import { DocumentEditForm } from "@/features/documents/components/document-edit-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadDocumentById, loadDocumentFormOptions } from "@/server/queries/documents.queries";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  const { id } = await params;

  if (!auth) {
    redirect("/login");
  }

  if (!auth.permissions.canCreateDocuments) {
    redirect(`/dashboard/documents/${id}`);
  }

  const document = await loadDocumentById({ id, tenantId: auth.tenantId });

  if (!document) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Document not found</h1>
        <p className="text-muted-foreground">
          This document does not exist or you do not have access to it.
        </p>
        <Button asChild>
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to documents
          </Link>
        </Button>
      </div>
    );
  }

  const { owners, templates } = await loadDocumentFormOptions(auth.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to documents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit document</h1>
        <p className="text-muted-foreground">
          Update metadata and access for “{document.title}”.
        </p>
      </div>

      <DocumentEditForm document={document} owners={owners} templates={templates} />
    </div>
  );
}
