import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { canSeeAllCrm, isSalesStaff } from "@/lib/platform-access";
import { loadCrmDashboard } from "@/server/queries/crm.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatGbp } from "@/features/crm/lib/labels";
import { CRM_STAGE_LABELS } from "@/features/crm/lib/labels";
import { Briefcase, PoundSterling, CheckCircle2, AlarmClock } from "lucide-react";

export default async function CrmDashboardPage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }

  const stats = await loadCrmDashboard(staff);
  const allCrm = canSeeAllCrm(staff);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{allCrm ? "Sales CRM" : "My pipeline"}</h1>
          <p className="text-muted-foreground">
            {allCrm
              ? "All UK leads, deals and follow-ups"
              : "Deals assigned to you"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/crm/companies/new">Add company</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open deals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openDealCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline value</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatGbp(stats.pipelineValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won deals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wonCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue tasks</CardTitle>
            <AlarmClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueTaskCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byStage.map((row) => (
              <div key={row.stage} className="flex items-center justify-between text-sm">
                <span>{CRM_STAGE_LABELS[row.stage]}</span>
                <span className="text-muted-foreground">
                  {row.count} · {formatGbp(row.value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue tasks</p>
            ) : (
              stats.overdueTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/admin/crm/companies/${task.organisation.id}`}
                  className="block text-sm hover:underline"
                >
                  <span className="font-medium">{task.title}</span>
                  <span className="text-muted-foreground"> · {task.organisation.name}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
