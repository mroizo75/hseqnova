import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { IncidentForm } from "@/features/incidents/components/incident-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { IncidentType } from "@prisma/client";
import { hasTenantFeature } from "@/lib/tenant-features";
import { getTranslations } from "next-intl/server";
import { getAdminDb } from "@/lib/supabase/admin";
import { loadNewIncidentFormData, loadEnabledModuleKeys } from "@/server/queries/incidents.queries";
import { tenantHasProjectsAddon } from "@/lib/tenant-modules";

type PageSearchParams =
  | Promise<{
      type?: IncidentType;
      projectId?: string;
      tablet?: string;
      template?: "homeVisitRisk" | "violenceThreat" | "infectionExposure";
    }>
  | {
      type?: IncidentType;
      projectId?: string;
      tablet?: string;
      template?: "homeVisitRisk" | "violenceThreat" | "infectionExposure";
    }
  | undefined;

export default async function NewIncidentPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const t = await getTranslations("dashboardIncidentNewPage");
  const resolvedSearchParams =
    typeof searchParams === "object" && searchParams !== null && "then" in searchParams
      ? await searchParams
      : (searchParams as {
          type?: IncidentType;
          projectId?: string;
          tablet?: string;
          template?: "homeVisitRisk" | "violenceThreat" | "infectionExposure";
        } | undefined);

  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("industry")
    .eq("id", auth.tenantId)
    .maybeSingle();

  const isHealthcareTenant = hasTenantFeature(tenant?.industry, "helseforetak");
  const isTabletMode = resolvedSearchParams?.tablet === "1" && isHealthcareTenant;

  const { risks, users, projects } = await loadNewIncidentFormData(auth.tenantId);
  const enabledModules = await loadEnabledModuleKeys(auth.tenantId);
  const showProjectFields = tenantHasProjectsAddon(enabledModules);
  const userList = users.filter((person) => person.id !== auth.userId);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/incidents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("actions.backToIncidents")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        {isTabletMode && (
          <p className="mt-2 text-sm font-medium text-blue-700">{t("tabletModeActive")}</p>
        )}
      </div>

      <IncidentForm
        tenantId={auth.tenantId}
        userId={auth.userId}
        risks={risks}
        users={userList}
        projects={showProjectFields ? projects : []}
        showProjectFields={showProjectFields}
        defaultType={resolvedSearchParams?.type}
        defaultProjectId={resolvedSearchParams?.projectId}
        isTabletMode={isTabletMode}
        templatePreset={resolvedSearchParams?.template}
      />
    </div>
  );
}
