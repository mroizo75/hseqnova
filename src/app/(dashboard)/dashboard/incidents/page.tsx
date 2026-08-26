import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IncidentTabs } from "@/features/incidents/components/incident-tabs";
import { UploadIncidentDialog } from "@/features/incidents/components/upload-incident-dialog";
import { Plus, AlertCircle, Clock, CheckCircle, ShieldAlert, FileWarning, Info, Send } from "lucide-react";
import Link from "next/link";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";
import { getTranslations } from "next-intl/server";
import { loadIncidentsForList } from "@/server/queries/incidents.queries";
import { getMainCategory } from "@/features/incidents/schemas/incident.schema";

export default async function IncidentsPage() {
  const t = await getTranslations("dashboardIncidentsPage");
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }
  const { permissions, tenantId, userId } = auth;

  const canReadAll = permissions.canReadIncidents;
  const canReadOwn = permissions.canReadOwnIncidents;
  const canCreate = permissions.canCreateIncidents;

  if (!canReadAll && !canReadOwn && !canCreate) {
    redirect("/dashboard");
  }

  const incidents =
    canReadAll || canReadOwn
      ? await loadIncidentsForList({
          tenantId,
          reportedBy: canReadAll ? undefined : userId,
        })
      : [];
  const showOwnOnlyNotice = !canReadAll && canReadOwn;
  const showCreateOnlyNotice = !canReadAll && !canReadOwn && canCreate;

  const stats = {
    total: incidents.length,
    accidentBook: incidents.filter((incident) => getMainCategory(incident.type) === "RUH").length,
    riddor: incidents.filter((incident) => incident.riddorReportable).length,
    open: incidents.filter((incident) => incident.status === "OPEN").length,
    closed: incidents.filter((incident) => incident.status === "CLOSED").length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <PageHelpDialog content={helpContent.incidents} />
        </div>
        <div className="page-header-actions">
          <UploadIncidentDialog />
          <Button asChild>
            <Link href="/dashboard/incidents/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.reportIncident")}
            </Link>
          </Button>
        </div>
      </div>

      {showCreateOnlyNotice && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
          <Send className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            You can report incidents, but you cannot view submitted incidents. Reports you submit are handled by the competent person or an administrator.
          </AlertDescription>
        </Alert>
      )}
      {showOwnOnlyNotice && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            You only see incidents you submitted. Reports you submit are handled by the competent person or a line manager.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.total.title")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t("stats.total.description")}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.accidentBook.title")}</CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.accidentBook}</div>
            <p className="text-xs text-muted-foreground">{t("stats.accidentBook.description")}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.riddor.title")}</CardTitle>
            <FileWarning className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.riddor}</div>
            <p className="text-xs text-muted-foreground">{t("stats.riddor.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.open.title")}</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground">{t("stats.open.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.closed.title")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">{t("stats.closed.description")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("allIncidents")}</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentTabs incidents={incidents} />
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">{t("iso.title")}</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">{t("iso.organizationShould")}</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>{t("iso.organizationList.react")}</li>
              <li>{t("iso.organizationList.assess")}</li>
              <li>{t("iso.organizationList.implement")}</li>
              <li>{t("iso.organizationList.review")}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">{t("iso.documentation")}</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>{t("iso.documentationList.nature")}</li>
              <li>{t("iso.documentationList.results")}</li>
              <li>{t("iso.documentationList.rootCause")}</li>
              <li>{t("iso.documentationList.learning")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
