import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Clock } from "lucide-react";
import Link from "next/link";
import { DocumentLegalNote } from "@/features/documents/components/document-legal-note";
import {
  loadPublishedDocumentsForRole,
  loadTenantRole,
} from "@/server/queries/documents.queries";
import { documentKindLabel } from "@/lib/document-uk";

export default async function AnsattDokumenter() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("employeeDocumentsPage");

  if (!session?.user?.tenantId || !session.user.id) {
    redirect("/login");
  }

  const userRole =
    (await loadTenantRole(session.user.id, session.user.tenantId)) || "ANSATT";
  const documents = await loadPublishedDocumentsForRole(session.user.tenantId, userRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("header.title")}</h1>
        <p className="text-muted-foreground">{t("header.description")}</p>
      </div>

      <DocumentLegalNote />

      <div className="space-y-3">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("empty")}</p>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Link key={doc.id} href={`/ansatt/dokumenter/${doc.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{doc.title}</h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Badge variant="outline" className="text-xs">
                          {documentKindLabel(doc.kind)}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {doc.version}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          {t("approvedBadge")}
                        </Badge>
                        {doc.approvedByUser && (
                          <span className="text-xs text-muted-foreground">
                            {t("approvedBy", {
                              name: doc.approvedByUser.name || doc.approvedByUser.email || "",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
