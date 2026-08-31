"use client";

import type { IncidentType } from "@prisma/client";
import { AccidentBookReportForm } from "@/features/incidents/components/accident-book-report-form";

export function IncidentForm({
  tenantId,
  userId,
  projects = [],
  defaultType,
  defaultProjectId,
  isTabletMode = false,
  showProjectFields = false,
}: {
  tenantId: string;
  userId: string;
  risks?: Array<{ id: string; title: string; category: string; score: number }>;
  users?: Array<{ id: string; name: string | null; email: string }>;
  projects?: Array<{ id: string; name: string; code: string | null; status: string }>;
  defaultType?: IncidentType;
  defaultProjectId?: string;
  isTabletMode?: boolean;
  templatePreset?: "homeVisitRisk" | "violenceThreat" | "infectionExposure";
  ruhModuleEnabled?: boolean;
  showProjectFields?: boolean;
}) {
  return (
    <AccidentBookReportForm
      tenantId={tenantId}
      userId={userId}
      projects={projects}
      defaultType={defaultType}
      defaultProjectId={defaultProjectId}
      isTabletMode={isTabletMode}
      showProjectFields={showProjectFields}
      successRedirectPath="/dashboard/incidents"
    />
  );
}
