import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import {
  countNonCompliantMeasurements,
  loadEnvironmentalAspects,
  loadTenantName,
  loadYearMeasurements,
} from "@/server/queries/environment.queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, AlertTriangle, TimerReset, Activity } from "lucide-react";
import Link from "next/link";
import { EnvironmentReportButton } from "@/features/environment/components/environment-report-button";
import { EnvironmentAspectList } from "@/features/environment/components/environment-aspect-list";
import { CO2CalculatorCard } from "@/features/environment/components/co2-calculator-card";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";

export default async function EnvironmentPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const year = new Date().getFullYear();
  const [aspects, nonCompliantCount, allMeasurements, tenantName] = await Promise.all([
    loadEnvironmentalAspects(auth.tenantId),
    countNonCompliantMeasurements(auth.tenantId),
    loadYearMeasurements(auth.tenantId, year),
    loadTenantName(auth.tenantId),
  ]);

  const total = aspects.length;
  const critical = aspects.filter((aspect) => aspect.significanceScore >= 20).length;
  const now = new Date();
  const overdueReviews = aspects.filter(
    (aspect) => aspect.nextReviewDate && new Date(aspect.nextReviewDate) < now
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-muted-foreground">ISO 14001</p>
            <h1 className="text-3xl font-bold">Environmental management</h1>
            <p className="text-muted-foreground">
              Overview of environmental aspects, measurements and follow-up
            </p>
          </div>
          <PageHelpDialog content={helpContent.environment} />
        </div>
        <div className="flex gap-2">
          <EnvironmentReportButton />
          <Button asChild>
            <Link href="/dashboard/environment/new">New environmental aspect</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered aspects</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">Total in the environmental register</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{critical}</div>
            <p className="text-xs text-muted-foreground">Significance &ge; 20</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Measurements in deviation</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{nonCompliantCount}</div>
            <p className="text-xs text-muted-foreground">Requires corrective action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue reviews</CardTitle>
            <TimerReset className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overdueReviews}</div>
            <p className="text-xs text-muted-foreground">Review date has passed</p>
          </CardContent>
        </Card>
      </div>

      <CO2CalculatorCard
        measurements={allMeasurements}
        companyName={tenantName}
      />

      <EnvironmentAspectList aspects={aspects} />
    </div>
  );
}
