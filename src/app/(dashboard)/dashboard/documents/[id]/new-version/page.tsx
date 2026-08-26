import { getAuthContext } from "@/lib/server-authorization";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NewVersionForm } from "@/features/documents/components/new-version-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadDocumentById } from "@/server/queries/documents.queries";

export default async function NewVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (!auth.permissions.canCreateDocuments) {
    redirect(`/dashboard/documents/${id}`);
  }

  const document = await loadDocumentById({ id, tenantId: auth.tenantId });

  if (!document) {
    return <div>Document not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to documents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Upload new version</h1>
        <p className="text-muted-foreground">
          {document.title} — current version: {document.version}
        </p>
      </div>

      <NewVersionForm document={document} />
    </div>
  );
}
