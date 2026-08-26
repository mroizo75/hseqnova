import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/supabase/admin";
import { HseqStatusDashboard } from "@/features/dashboard/components/hseq-status-dashboard";
import { evaluateHseqStatus } from "@/lib/hseq-status";
import { getPermissions } from "@/lib/permissions";
import {
  allowedHseqDutyKeys,
  loadEnabledModuleKeys,
  loadHseqStatusInput,
} from "@/server/queries/hseq-status.queries";
import type { Role } from "@prisma/client";
import { SafetyRepresentativeCard } from "@/features/dashboard/components/safety-representative-card";

function asTime(value: string | Date | null | undefined): number {
  if (!value) return 0;
  return new Date(value).getTime();
}

function asIso(value: string | Date | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  return new Date(value).toISOString();
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const db = getAdminDb();
  const { data: user } = await db
    .from("User")
    .select("id, name, email")
    .eq("email", session.user.email)
    .maybeSingle();

  if (!user) {
    return <div>You are not linked to a company.</div>;
  }

  const { data: memberships } = await db
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", user.id);

  if (!memberships || memberships.length === 0) {
    return <div>You are not linked to a company.</div>;
  }

  const selectedMembership = memberships.find(
    (membership) => membership.tenantId === session.user.tenantId,
  );
  if (!selectedMembership) {
    return <div>You do not have access to this company.</div>;
  }

  const { data: tenant } = await db
    .from("Tenant")
    .select("isTavleOnly")
    .eq("id", selectedMembership.tenantId)
    .maybeSingle();
  if (!tenant) {
    return <div>You do not have access to this company.</div>;
  }

  if (tenant.isTavleOnly) {
    redirect("/dashboard/hms-tavle");
  }

  const userRole = selectedMembership.role as Role;
  const permissions = getPermissions(userRole);
  const tenantId = selectedMembership.tenantId as string;
  const now = new Date();
  const allowedKeys = allowedHseqDutyKeys(permissions);
  const enabledModules = await loadEnabledModuleKeys(tenantId);
  const statusInput = await loadHseqStatusInput({
    tenantId,
    now,
    enabledModules,
    allowedKeys,
  });
  const report = evaluateHseqStatus(statusInput);

  const incidentsRes = permissions.canReadIncidents
    ? await db
        .from("Incident")
        .select("id, title, location, occurredAt, closedAt, status")
        .eq("tenantId", tenantId)
    : { data: [] as Array<Record<string, unknown>> };

  const incidents = (incidentsRes.data ?? []) as Array<Record<string, unknown>>;
  const tenWeeksAgo = new Date(now);
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70);
  const weeklyTrendData: Array<{ week: string; opened: number; closed: number }> = [];
  if (permissions.canReadIncidents && incidents.length > 0) {
    for (let weekIndex = 0; weekIndex < 10; weekIndex += 1) {
      const weekStart = new Date(tenWeeksAgo);
      weekStart.setDate(weekStart.getDate() + weekIndex * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekNum = Math.ceil(
        (weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 86400000),
      );
      weeklyTrendData.push({
        week: `Week ${weekNum}`,
        opened: incidents.filter((incident) => {
          const occurred = new Date(String(incident.occurredAt));
          return occurred >= weekStart && occurred < weekEnd;
        }).length,
        closed: incidents.filter((incident) => {
          if (!incident.closedAt) return false;
          const closed = new Date(incident.closedAt as string);
          return closed >= weekStart && closed < weekEnd;
        }).length,
      });
    }
  }

  const recentIncidents = [...incidents]
    .sort((a, b) => asTime(b.occurredAt as string) - asTime(a.occurredAt as string))
    .slice(0, 5)
    .map((incident) => ({
      id: String(incident.id),
      title: String(incident.title ?? ""),
      location: String(incident.location ?? ""),
      occurredAt: asIso(incident.occurredAt as string),
      status: String(incident.status ?? ""),
    }));

  const asOf = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {userRole === "VERNEOMBUD" ? <SafetyRepresentativeCard /> : null}
      <HseqStatusDashboard
        userName={String(user.name || user.email)}
        asOf={asOf}
        report={report}
        weeklyTrendData={weeklyTrendData}
        recentIncidents={recentIncidents}
      />
    </div>
  );
}
