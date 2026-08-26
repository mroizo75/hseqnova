import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { DocumentForm } from "@/features/documents/components/document-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadDocumentFormOptions } from "@/server/queries/documents.queries";

export default async function NewDocumentPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (!auth.permissions.canCreateDocuments) {
    redirect("/dashboard/documents");
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
        <h1 className="text-3xl font-bold">New document</h1>
        <p className="text-muted-foreground">
          Upload a controlled document. Drafts must be approved before they become the current version.
        </p>
      </div>

      <DocumentForm tenantId={auth.tenantId} owners={owners} templates={templates} />
    </div>
  );
}
