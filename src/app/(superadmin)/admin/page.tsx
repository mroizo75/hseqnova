import { getServerSession } from "next-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { loadAdminOverviewStats } from "@/server/queries/admin.queries";

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }
  if (!session.user.isSuperAdmin && !session.user.isSupport) {
    redirect("/login");
  }

  const { activeTenants, totalUsers, incidentsThisMonth, openActions } =
    await loadAdminOverviewStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">HSEQ overview</h1>
        <p className="text-muted-foreground">
          Aggregated statistics across all organisations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active organisations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTenants}</div>
            <p className="text-xs text-muted-foreground">Active and trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents this month</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidentsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open actions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openActions}</div>
            <p className="text-xs text-muted-foreground">Open or in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/tenants"
          className="text-sm font-medium text-primary hover:underline"
        >
          Manage organisations →
        </Link>
        <Link
          href="/admin/registrations"
          className="text-sm font-medium text-primary hover:underline"
        >
          View registrations →
        </Link>
      </div>
    </div>
  );
}
