import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Shield,
  Bell,
  AlertTriangle,
  ListChecks,
  GraduationCap,
  Clock,
} from "lucide-react";
import { QuickReportFab } from "@/features/incidents/components/quick-report-fab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import {
  EMPLOYEE_WIDGET_REGISTRY,
  getEmployeeWidgetsFromLockedConfig,
  type EmployeeWidgetDefinition,
} from "@/features/dashboard/lib/employee-widget-registry";
import { isPast, addDays } from "date-fns";
import { ActivityTimeline } from "@/components/activity-timeline";

export default async function AnsattDashboard() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("employeeDashboard");

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const [tenant, myActions, myIncidents, myTraining] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        hmsContactName: true,
        hmsContactPhone: true,
        hmsContactEmail: true,
        timeRegistrationEnabled: true,
        industry: true,
        dashboardLocked: true,
        lockedDashboardConfig: true,
        ruhModuleEnabled: true,
      },
    }),
    prisma.measure.findMany({
      where: {
        tenantId,
        responsibleId: userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      select: { id: true, dueAt: true, title: true },
      orderBy: { dueAt: "asc" },
      take: 50,
    }),
    prisma.incident.findMany({
      where: {
        tenantId,
        reportedBy: userId,
        status: { not: "CLOSED" },
      },
      select: { id: true },
      take: 50,
    }),
    prisma.training.findMany({
      where: {
        tenantId,
        userId,
        validUntil: { lte: addDays(new Date(), 30) },
      },
      select: { id: true, validUntil: true },
      take: 50,
    }),
  ]);

  const isAgricultureTenant = tenant?.industry?.toLowerCase() === "agriculture";
  const tenantName = session.user.tenantName;

  let visibleWidgets: EmployeeWidgetDefinition[];
  if (tenant?.dashboardLocked && tenant.lockedDashboardConfig) {
    const lockedConfig = tenant.lockedDashboardConfig as Array<{ id: string }>;
    visibleWidgets = getEmployeeWidgetsFromLockedConfig(lockedConfig);
  } else {
    visibleWidgets = [...EMPLOYEE_WIDGET_REGISTRY];
  }

  if (!tenant?.timeRegistrationEnabled) {
    visibleWidgets = visibleWidgets.filter((w) => w.id !== "emp-time");
  }
  if (tenant && !tenant.ruhModuleEnabled) {
    visibleWidgets = visibleWidgets.filter((w) => w.id !== "emp-ruh");
  }

  const overdueActions = myActions.filter((a) => isPast(new Date(a.dueAt)));
  const expiringTraining = myTraining.filter(
    (t) => t.validUntil && isPast(new Date(t.validUntil)),
  );

  return (
    <div className="space-y-6">
      <QuickReportFab />
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t("welcome.title", { name: session.user.name?.split(" ")[0] ?? "" })}
        </h2>
        <p className="text-gray-600">{t("welcome.subtitle")}</p>
        {tenantName && (
          <div className="mt-3 pt-3 border-t border-gray-200 lg:hidden">
            <p className="text-sm text-gray-500">
              <span className="font-medium">{tenantName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/ansatt/tiltak">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Open actions</p>
                  <p className="text-xl font-bold">{myActions.length}</p>
                </div>
                <ListChecks className="h-6 w-6 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ansatt/tiltak">
          <Card
            className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              overdueActions.length > 0 ? "border-l-red-500" : "border-l-gray-200"
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-xl font-bold">{overdueActions.length}</p>
                </div>
                <AlertTriangle
                  className={`h-6 w-6 ${
                    overdueActions.length > 0 ? "text-red-500" : "text-gray-300"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ansatt/avvik">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Open incidents</p>
                  <p className="text-xl font-bold">{myIncidents.length}</p>
                </div>
                <Shield className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ansatt/opplaering">
          <Card
            className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              expiringTraining.length > 0 ? "border-l-red-500" : "border-l-blue-500"
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Training due</p>
                  <p className="text-xl font-bold">{myTraining.length}</p>
                </div>
                <GraduationCap
                  className={`h-6 w-6 ${
                    expiringTraining.length > 0 ? "text-red-500" : "text-blue-500"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerts */}
      {(overdueActions.length > 0 || expiringTraining.length > 0) && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Attention required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueActions.length > 0 && (
              <Link
                href="/ansatt/tiltak"
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    {overdueActions.length} overdue action{overdueActions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Badge className="bg-red-100 text-red-700">View</Badge>
              </Link>
            )}
            {expiringTraining.length > 0 && (
              <Link
                href="/ansatt/opplaering"
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">
                    {expiringTraining.length} expired training record{expiringTraining.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Badge className="bg-amber-100 text-amber-700">View</Badge>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {isAgricultureTenant && (
        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("agricultureQuickStart.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link href="/ansatt/avvik/ny" className="rounded-lg border p-3 hover:bg-muted">
              <p className="font-medium">{t("agricultureQuickStart.cards.incident.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("agricultureQuickStart.cards.incident.description")}
              </p>
            </Link>
            <Link href="/ansatt/vernerunder" className="rounded-lg border p-3 hover:bg-muted">
              <p className="font-medium">{t("agricultureQuickStart.cards.inspection.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("agricultureQuickStart.cards.inspection.description")}
              </p>
            </Link>
            <Link href="/ansatt/sja" className="rounded-lg border p-3 hover:bg-muted">
              <p className="font-medium">{t("agricultureQuickStart.cards.sja.title")}</p>
              <p className="text-xs text-muted-foreground">
                {t("agricultureQuickStart.cards.sja.description")}
              </p>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Widget grid */}
      <div className="grid grid-cols-2 gap-4">
        {visibleWidgets.map((widget) => (
          <Link key={widget.id} href={widget.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div
                  className={`h-16 w-16 rounded-full ${widget.bgColor} flex items-center justify-center mb-3`}
                >
                  <widget.icon className={`h-8 w-8 ${widget.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{widget.label}</h3>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline tenantWide limit={10} />
        </CardContent>
      </Card>

      {/* Emergency contacts */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-red-600">{t("emergency.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Emergency services</span>
            <a href="tel:999" className="text-red-600 font-bold text-lg">
              999
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Non-emergency</span>
            <a href="tel:101" className="text-red-600 font-bold text-lg">
              101
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">NHS</span>
            <a href="tel:111" className="text-red-600 font-bold text-lg">
              111
            </a>
          </div>
          {tenant?.hmsContactName && (
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t("emergency.hmsResponsible")}</span>
                <span className="text-primary font-medium">{tenant.hmsContactName}</span>
              </div>
              {tenant.hmsContactPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("emergency.phone")}</span>
                  <a
                    href={`tel:${tenant.hmsContactPhone}`}
                    className="text-primary font-bold"
                  >
                    {tenant.hmsContactPhone}
                  </a>
                </div>
              )}
              {tenant.hmsContactEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("emergency.email")}</span>
                  <a
                    href={`mailto:${tenant.hmsContactEmail}`}
                    className="text-primary text-sm"
                  >
                    {tenant.hmsContactEmail}
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
