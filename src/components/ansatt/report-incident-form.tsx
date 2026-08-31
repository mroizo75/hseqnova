"use client";

import { AccidentBookReportForm } from "@/features/incidents/components/accident-book-report-form";

export function ReportIncidentForm({
  tenantId,
  reportedBy,
  projects = [],
  successRedirectPath = "/ansatt/avvik/takk",
  showProjectFields = false,
}: {
  tenantId: string;
  reportedBy: string;
  projects?: Array<{ id: string; name: string; code: string | null }>;
  successRedirectPath?: string;
  ruhModuleEnabled?: boolean;
  showProjectFields?: boolean;
}) {
  return (
    <AccidentBookReportForm
      tenantId={tenantId}
      userId={reportedBy}
      projects={projects}
      showProjectFields={showProjectFields}
      successRedirectPath={successRedirectPath}
    />
  );
}
