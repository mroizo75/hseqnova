import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Building2, MapPin, User, CalendarDays,
  Edit, FileText,
} from "lucide-react";
import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";
import { ProjectTabs } from "@/features/projects/components/project-tabs";
import { getTranslations } from "next-intl/server";
import { loadDutyHoldersForProject, loadProjectDetail } from "@/server/queries/projects.queries";
import { CDM_DUTY_HOLDER_LABELS, type CdmDutyHolderRoleKey } from "@/features/projects/lib/cdm-duty-holders";

function getStatusConfig(
  t: Awaited<ReturnType<typeof getTranslations>>
): Record<ProjectStatus, { label: string; color: string }> {
  return {
    PLANNING: { label: t("status.planning"), color: "bg-blue-100 text-blue-800 border-blue-300" },
    ACTIVE: { label: t("status.active"), color: "bg-green-100 text-green-800 border-green-300" },
    ON_HOLD: { label: t("status.onHold"), color: "bg-amber-100 text-amber-800 border-amber-300" },
    COMPLETED: { label: t("status.completed"), color: "bg-gray-100 text-gray-700 border-gray-300" },
    ARCHIVED: { label: t("status.archived"), color: "bg-gray-100 text-gray-500 border-gray-200" },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("dashboardProjectDetailPage");
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const [project, dutyHolders] = await Promise.all([
    loadProjectDetail(id, session.user.tenantId),
    loadDutyHoldersForProject(id, session.user.tenantId),
  ]);
  if (!project) notFound();

  const sc = getStatusConfig(t)[project.status];
  const manHours = project.timeEntries.reduce((s, e) => s + e.hours, 0);

  const hseIncidents = project.incidents.filter((i) =>
    ["ULYKKE", "NESTEN", "YRKESSYKDOM"].includes(i.type)
  );
  const fatalities = hseIncidents.filter((i) => i.isFatal).length;
  const lti = hseIncidents.filter((i) => i.isLostTimeIncident).length;
  const restricted = hseIncidents.filter((i) => i.isRestrictedWork).length;
  const medical = hseIncidents.filter((i) => i.medicalAttentionRequired).length;
  const totalRecordable = fatalities + lti + restricted + medical;
  const trir =
    manHours > 0
      ? Math.round(((totalRecordable * 200000) / manHours) * 100) / 100
      : null;

  const openMeasures = project.measures.filter(
    (m) => !["DONE", "CANCELLED"].includes(m.status)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={`border ${sc.color}`}>{sc.label}</Badge>
              {project.code && (
                <span className="font-mono text-sm text-muted-foreground">{project.code}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              {project.clientName && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {project.clientName}
                </span>
              )}
              {project.orderNumber && (
                <span className="font-mono text-xs">{t("orderNumber", { number: project.orderNumber })}</span>
              )}
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {project.location}
                </span>
              )}
              {project.projectManager && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {project.projectManager.name || project.projectManager.email}
                </span>
              )}
              {(project.startDate || project.endDate) && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString("en-GB")
                    : "—"}
                  {" → "}
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString("en-GB")
                    : t("ongoing")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Edit className="mr-1 h-3.5 w-3.5" />
              {t("actions.edit")}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <a href={`/api/projects/${project.id}/report`} target="_blank">
              <FileText className="mr-1 h-3.5 w-3.5" />
              {t("actions.pdfReport")}
            </a>
          </Button>
        </div>
      </div>

      {dutyHolders.length > 0 ? (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">CDM 2015 duty holders</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {dutyHolders.map((holder) => (
                <div key={holder.id}>
                  <p className="text-xs text-muted-foreground">
                    {CDM_DUTY_HOLDER_LABELS[holder.role as CdmDutyHolderRoleKey] ?? holder.role}
                  </p>
                  <p className="text-sm font-medium">{holder.organisationName}</p>
                  {holder.contactName ? (
                    <p className="text-xs text-muted-foreground">{holder.contactName}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("cards.incidents.title")}</p>
            <p className="text-2xl font-bold text-red-600 mt-0.5">{project.incidents.length}</p>
            <p className="text-xs text-muted-foreground">{t("cards.incidents.description")}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("cards.rams.title")}</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{project.sjaAnalyses.length}</p>
            <p className="text-xs text-muted-foreground">{t("cards.rams.description")}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("cards.inspections.title")}</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{project.inspections.length}</p>
            <p className="text-xs text-muted-foreground">{t("cards.inspections.description")}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("cards.openMeasures.title")}</p>
            <p className={`text-2xl font-bold mt-0.5 ${openMeasures > 0 ? "text-orange-600" : "text-green-600"}`}>
              {openMeasures}
            </p>
            <p className="text-xs text-muted-foreground">{t("cards.openMeasures.description", { total: project.measures.length })}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("cards.hours.title")}</p>
            <p className="text-2xl font-bold mt-0.5">
              {manHours > 0 ? Math.round(manHours).toLocaleString("en-GB") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">{t("cards.hours.description")}</p>
          </CardContent>
        </Card>
        <Card className={`lg:col-span-1 ${trir !== null && trir > 5 ? "border-red-200 bg-red-50/30" : ""}`}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("cards.trir.title")}</p>
            <p className={`text-2xl font-bold mt-0.5 ${
              trir === null ? "text-muted-foreground" :
              trir === 0 ? "text-green-600" :
              trir < 3 ? "text-blue-600" :
              trir < 5 ? "text-amber-600" : "text-red-600"
            }`}>
              {trir !== null ? trir.toFixed(2) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {trir === null ? t("cards.trir.requiresHours") : t("cards.trir.perHours")}
            </p>
          </CardContent>
        </Card>
      </div>

      <ProjectTabs
        projectId={project.id}
        incidents={project.incidents as any}
        sjaAnalyses={project.sjaAnalyses as any}
        inspections={project.inspections as any}
        measures={project.measures as any}
        timeEntries={project.timeEntries as any}
        attachments={project.attachments}
        formSubmissions={project.formSubmissions as any}
      />
    </div>
  );
}
