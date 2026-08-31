import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrainingHeaderActions } from "@/features/training/components/training-header-actions";
import { TrainingList } from "@/features/training/components/training-list";
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";
import { getTranslations } from "next-intl/server";
import {
  loadCourseTemplatesForTenant,
  loadTrainingPeople,
  loadTrainingsForTenant,
} from "@/server/queries/training.queries";
import { AiToolboxTalk } from "@/features/training/components/ai-toolbox-talk";
import { TrainingLegalNote } from "@/features/training/components/training-legal-note";
import { hasAiAddon } from "@/lib/ai-gate";

export default async function TrainingPage() {
  const t = await getTranslations("dashboardTrainingPage");
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const [trainingsRaw, tenantUsers, courseTemplates, aiEnabled] = await Promise.all([
    loadTrainingsForTenant(tenantId),
    loadTrainingPeople(tenantId),
    loadCourseTemplatesForTenant(tenantId, { activeOnly: true }),
    hasAiAddon(tenantId),
  ]);

  const userMap = new Map(tenantUsers.map((u) => [u.id, u]));
  const trainingsWithUser = trainingsRaw
    .map((row) => ({ ...row, user: userMap.get(row.userId) }))
    .filter((row): row is typeof row & { user: NonNullable<typeof row.user> } => !!row.user);

  const requiredCourseKeys = courseTemplates
    .filter((course) => course.isRequired)
    .map((course) => course.courseKey);

  const now = new Date();
  const completed = trainingsRaw.filter((row) => row.completedAt).length;

  const expiringSoon = trainingsRaw.filter((row) => {
    if (!row.validUntil) return false;
    const days = Math.ceil(
      (new Date(row.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return days > 0 && days <= 30;
  }).length;

  const expired = trainingsRaw.filter((row) => {
    if (!row.validUntil) return false;
    return new Date(row.validUntil) < now;
  }).length;

  const employeesWithGaps = tenantUsers.filter((user) => {
    const userCourseKeys = new Set(
      trainingsRaw
        .filter((row) => row.userId === user.id && row.completedAt)
        .filter((row) => {
          if (!row.validUntil) return true;
          return new Date(row.validUntil) >= now;
        })
        .map((row) => row.courseKey),
    );
    return requiredCourseKeys.some((key) => !userCourseKeys.has(key));
  }).length;

  const expiringTrainings = trainingsWithUser
    .filter((training) => {
      if (!training.validUntil) return false;
      const days = Math.ceil(
        (new Date(training.validUntil).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return days <= 30;
    })
    .sort((a, b) => {
      const aDate = a.validUntil ? new Date(a.validUntil).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.validUntil ? new Date(b.validUntil).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    })
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
              {t("title")}
            </h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <PageHelpDialog content={helpContent.training} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/training/roles">
            <Button variant="outline" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Role Requirements
            </Button>
          </Link>
          <TrainingHeaderActions
            tenantId={tenantId}
            users={tenantUsers}
            courseTemplates={courseTemplates}
          />
        </div>
      </div>

      <TrainingLegalNote />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.completed.title")}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <p className="text-xs text-muted-foreground">
              {trainingsRaw.length > 0
                ? t("stats.completed.percentOfTotal", {
                    percent: Math.round((completed / trainingsRaw.length) * 100),
                  })
                : t("stats.completed.zero")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.expiringSoon.title")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringSoon}</div>
            <p className="text-xs text-muted-foreground">{t("stats.expiringSoon.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.expired.title")}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expired}</div>
            <p className="text-xs text-muted-foreground">{t("stats.expired.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.employeesWithGaps.title")}</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{employeesWithGaps}</div>
            <p className="text-xs text-muted-foreground">
              {t("stats.employeesWithGaps.description", { total: tenantUsers.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      {expiringTrainings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">
              {t("expiryAlerts.title")}
            </CardTitle>
            <CardDescription className="text-amber-800">
              {t("expiryAlerts.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringTrainings.map((training) => {
                const daysUntilExpiry = training.validUntil
                  ? Math.ceil(
                      (new Date(training.validUntil).getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
                const isExpired = (daysUntilExpiry ?? 1) <= 0;
                return (
                  <div
                    key={training.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-amber-200 bg-white p-3"
                  >
                    <div>
                      <p className="font-medium">{training.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {training.user?.name || training.user?.email || t("expiryAlerts.unknownEmployee")}
                      </p>
                    </div>
                    <Badge variant={isExpired ? "destructive" : "outline"}>
                      {isExpired
                        ? t("expiryAlerts.expired")
                        : t("expiryAlerts.daysLeft", { days: daysUntilExpiry })}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {aiEnabled && <AiToolboxTalk aiEnabled={aiEnabled} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("list.title")}</CardTitle>
          <CardDescription>
            {t("list.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingList
            tenantId={tenantId}
            trainings={trainingsWithUser}
            tenantUsers={tenantUsers}
            requiredCourseKeys={requiredCourseKeys}
            courseTemplates={courseTemplates}
          />
        </CardContent>
      </Card>
    </div>
  );
}
