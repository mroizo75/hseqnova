import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, Clock, Calendar, User, FileText } from "lucide-react";
import Link from "next/link";
import { DocumentLegalNote } from "@/features/documents/components/document-legal-note";
import {
  loadPublishedDocumentForRole,
  loadTenantRole,
} from "@/server/queries/documents.queries";
import { documentKindLabel } from "@/lib/document-uk";

export default async function AnsattDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("employeeDocumentDetailPage");
  const dateLocale = "en-GB";
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId || !session.user.id) {
    redirect("/login");
  }

  const userRole =
    (await loadTenantRole(session.user.id, session.user.tenantId)) || "ANSATT";
  const document = await loadPublishedDocumentForRole({
    id,
    tenantId: session.user.tenantId,
    role: userRole,
  });

  if (!document) {
    notFound();
  }

  const isWord =
    document.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    document.mime === "application/msword";
  const viewUrl = `/api/documents/${document.id}/view`;
  const downloadUrl = `/api/documents/${document.id}/download`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ansatt/dokumenter">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("header.back")}
          </Button>
        </Link>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{document.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{documentKindLabel(document.kind)}</Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {t("approvedBadge")}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentLegalNote />

      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t("documentCard.title")}
          </CardTitle>
          <CardDescription>
            {isWord
              ? t("documentCard.descriptionWord")
              : t("documentCard.descriptionDefault")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={viewUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full md:w-auto">
              <Eye className="mr-2 h-5 w-5" />
              {t("documentCard.view")} {isWord ? "(PDF)" : ""}
            </Button>
          </Link>
          <Link href={downloadUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="w-full md:w-auto bg-transparent">
              <Download className="mr-2 h-5 w-5" />
              {isWord ? t("documentCard.downloadOriginal") : t("documentCard.download")}
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("details.title")}</CardTitle>
          <CardDescription>{t("details.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("details.version")}
              </p>
              <p className="font-medium">{document.version}</p>
            </div>

            {document.approvedByUser && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("details.approvedBy")}
                </p>
                <p className="font-medium">
                  {document.approvedByUser.name || document.approvedByUser.email}
                </p>
              </div>
            )}

            {document.approvedAt && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("details.approvedAt")}
                </p>
                <p className="font-medium">
                  {new Date(document.approvedAt).toLocaleDateString(dateLocale)}
                </p>
              </div>
            )}

            {document.nextReviewDate && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("details.nextReview")}
                </p>
                <p className="font-medium">
                  {new Date(document.nextReviewDate).toLocaleDateString(dateLocale)}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">{t("details.updatedAt")}</p>
              <p className="font-medium">
                {new Date(document.updatedAt).toLocaleDateString(dateLocale)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
