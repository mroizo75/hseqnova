import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/features/documents/components/document-list";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";
import { getTranslations } from "next-intl/server";
import { loadDocumentsForList } from "@/server/queries/documents.queries";
import { DocumentLegalNote } from "@/features/documents/components/document-legal-note";

export default async function DocumentsPage() {
  const t = await getTranslations("dashboardDocumentsPage");
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (!auth.permissions.canReadDocuments) {
    redirect("/dashboard");
  }

  const allDocuments = await loadDocumentsForList(auth.tenantId);
  const canManageDocuments =
    auth.permissions.canCreateDocuments || auth.permissions.canApproveDocuments;
  const documents = canManageDocuments
    ? allDocuments
    : allDocuments.filter((row) => row.status === "APPROVED");

  const stats = {
    total: documents.length,
    draft: documents.filter((d) => d.status === "DRAFT").length,
    approved: documents.filter((d) => d.status === "APPROVED").length,
    archived: documents.filter((d) => d.status === "ARCHIVED").length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <PageHelpDialog content={helpContent.documents} />
        </div>
        {auth.permissions.canCreateDocuments && (
          <Button asChild>
            <Link href="/dashboard/documents/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.newDocument")}
            </Link>
          </Button>
        )}
      </div>

      <DocumentLegalNote />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.total")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.draft")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.approved")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.archived")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      <DocumentList documents={documents} tenantId={auth.tenantId} currentUserId={auth.userId} />
    </div>
  );
}
