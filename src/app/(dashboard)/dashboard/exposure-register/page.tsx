import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Plus, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ExposureRegisterList } from "./exposure-register-list";
import { loadExposureRegistersForTenant } from "@/server/queries/exposure-register.queries";
import { HealthRecordLegalNote } from "@/features/exposure-register/components/health-record-legal-note";
import {
  effectiveExposureStatus,
  isHealthSurveillancePending,
} from "@/features/exposure-register/lib/exposure-status";

export default async function ExposureRegisterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;
  const entries = await loadExposureRegistersForTenant(tenantId);

  const stats = {
    total: entries.length,
    active: entries.filter((e) => effectiveExposureStatus(e.status, e.exposureEndDate) === "ACTIVE").length,
    inactive: entries.filter((e) => effectiveExposureStatus(e.status, e.exposureEndDate) === "INACTIVE").length,
    healthCheckPending: entries.filter((e) =>
      isHealthSurveillancePending(e.healthCheckRequired, e.healthCheckDone),
    ).length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <FlaskConical className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Health records</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-0.5">
            Exposure and health surveillance records · kept 40 years (COSHH 2002)
          </p>
        </div>
        <Link href="/dashboard/exposure-register/new">
          <Button className="w-full sm:w-auto shrink-0 gap-2">
            <Plus className="h-4 w-4" />
            Record exposure
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="border-0 bg-slate-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-0.5">records</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Ongoing</p>
              <FlaskConical className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-700">{stats.active}</p>
            <p className="text-xs text-orange-500 mt-0.5">active exposures</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Ended</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-700">{stats.inactive}</p>
            <p className="text-xs text-green-500 mt-0.5">historical</p>
          </CardContent>
        </Card>

        <Card className={`border-0 ${stats.healthCheckPending > 0 ? "bg-red-50" : "bg-gray-50"}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium uppercase tracking-wide ${stats.healthCheckPending > 0 ? "text-red-600" : "text-gray-500"}`}>
                Health surveillance
              </p>
              {stats.healthCheckPending > 0
                ? <AlertTriangle className="h-4 w-4 text-red-500" />
                : <Clock className="h-4 w-4 text-gray-400" />
              }
            </div>
            <p className={`text-3xl font-bold ${stats.healthCheckPending > 0 ? "text-red-700" : "text-gray-600"}`}>
              {stats.healthCheckPending}
            </p>
            <p className={`text-xs mt-0.5 ${stats.healthCheckPending > 0 ? "text-red-500" : "text-gray-400"}`}>
              not completed
            </p>
          </CardContent>
        </Card>
      </div>

      <HealthRecordLegalNote />

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recorded exposures</CardTitle>
              <CardDescription className="mt-0.5">
                One record per employee per exposure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ExposureRegisterList entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
