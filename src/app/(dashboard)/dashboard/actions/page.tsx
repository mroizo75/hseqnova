import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasureForm } from "@/features/measures/components/measure-form";
import { MeasureList } from "@/features/measures/components/measure-list";
import { MeasureLegalNote } from "@/features/measures/components/measure-legal-note";
import { ListTodo, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";
import { getTranslations } from "next-intl/server";
import {
  loadFireDrillForTenant,
  loadMeasurePeople,
  loadMeasuresForTenant,
  loadProjectForTenant,
} from "@/server/queries/measures.queries";

interface ActionsPageProps {
  searchParams: Promise<{ projectId?: string; fireDrillId?: string }>;
}

export default async function ActionsPage({ searchParams }: ActionsPageProps) {
  const t = await getTranslations("dashboardActionsPage");
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const { projectId, fireDrillId } = await searchParams;

  const [measures, tenantUsers, selectedProject, selectedFireDrill] = await Promise.all([
    loadMeasuresForTenant(tenantId),
    loadMeasurePeople(tenantId),
    projectId ? loadProjectForTenant(projectId, tenantId) : Promise.resolve(null),
    fireDrillId ? loadFireDrillForTenant(fireDrillId, tenantId) : Promise.resolve(null),
  ]);

  const now = new Date();
  const stats = {
    total: measures.length,
    pending: measures.filter((row) => row.status === "PENDING").length,
    inProgress: measures.filter((row) => row.status === "IN_PROGRESS").length,
    done: measures.filter((row) => row.status === "DONE").length,
    overdue: measures.filter((row) => row.status !== "DONE" && new Date(row.dueAt) < now).length,
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <PageHelpDialog content={helpContent.actions} />
        </div>
        <MeasureForm
          tenantId={tenantId}
          projectId={selectedProject?.id}
          fireDrillId={selectedFireDrill?.id}
          users={tenantUsers}
        />
      </div>

      <MeasureLegalNote />
      {selectedProject ? (
        <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
          {t("projectInfo")} <strong>{selectedProject.name}</strong>
        </div>
      ) : null}
      {selectedFireDrill ? (
        <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
          {t("fireDrillInfo")} <strong>{selectedFireDrill.title}</strong>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.total.title")}</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t("stats.total.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.inProgress.title")}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending + stats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("stats.inProgress.description", {
                pending: stats.pending,
                inProgress: stats.inProgress,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.done.title")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <p className="text-xs text-muted-foreground">{t("stats.done.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.overdue.title")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">{t("stats.overdue.description")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("list.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasureList measures={measures} />
        </CardContent>
      </Card>
    </div>
  );
}
