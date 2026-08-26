import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { AlertTriangle, CheckCircle2, FileWarning, HardHat } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getAuthMembership } from "@/lib/auth-db";
import type { Role } from "@prisma/client";
import { getPermissions } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCdmOverviewProjects } from "@/server/queries/construction-compliance.queries";

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function ConstructionComplianceOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    redirect("/login");
  }

  const membership = await getAuthMembership(session.user.id, session.user.tenantId);
  if (!membership) {
    return <div>No access</div>;
  }
  const permissions = getPermissions(membership.role as Role);
  if (!permissions.canReadConstructionCompliance) {
    redirect("/dashboard");
  }

  const projects = await loadCdmOverviewProjects(session.user.tenantId);
  const todayKey = formatDateOnly(new Date());
  const rows = projects.map((project) => {
    const hasDailyCheckToday =
      project.lastCheckDate !== null && formatDateOnly(new Date(project.lastCheckDate)) === todayKey;
    const missingDailyCheck = project.activeWorkers > 0 && !hasDailyCheckToday;
    return {
      ...project,
      hasDailyCheckToday,
      missingDailyCheck,
    };
  });

  const projectsWithMissingControl = rows.filter((row) => row.missingDailyCheck).length;
  const projectsWithoutSha = rows.filter((row) => !row.hasShaPlan).length;
  const projectsWithoutPreNotification = rows.filter((row) => !row.hasPreNotification).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <HardHat className="h-8 w-8 text-amber-600" />
          CDM 2015 compliance
        </h1>
        <p className="text-muted-foreground">
          Overview of the Construction Phase Plan, F10 notification and daily check of the site register.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Missing daily check</p>
            <p className="text-2xl font-bold text-amber-700">{projectsWithMissingControl}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Projects without a Construction Phase Plan</p>
            <p className="text-2xl font-bold text-red-700">{projectsWithoutSha}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Projects without F10 notification</p>
            <p className="text-2xl font-bold text-red-700">{projectsWithoutPreNotification}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            Open the project to record and maintain CDM 2015 data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects recorded.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.location || "No location"}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/projects/${row.id}/construction-compliance`}>
                      Open project compliance
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={row.hasShaPlan ? "default" : "destructive"}>
                    {row.hasShaPlan ? "CPP recorded" : "CPP missing"}
                  </Badge>
                  <Badge variant={row.hasPreNotification ? "default" : "destructive"}>
                    {row.hasPreNotification ? "F10 notification OK" : "F10 notification missing"}
                  </Badge>
                  <Badge variant={row.missingDailyCheck ? "destructive" : "secondary"}>
                    {row.missingDailyCheck
                      ? "Daily check missing"
                      : row.activeWorkers > 0
                      ? "Daily check OK"
                      : "No active people"}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    {row.missingDailyCheck ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    )}
                    Last check: {row.lastCheckDate ? new Date(row.lastCheckDate).toLocaleDateString("en-GB") : "None"}
                  </span>
                  {!row.hasShaPlan || !row.hasPreNotification ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-700">
                      <FileWarning className="h-3.5 w-3.5" />
                      Missing mandatory CDM records
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
