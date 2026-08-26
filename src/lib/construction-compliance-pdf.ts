/**
 * PDF generator for CDM 2015 project compliance.
 * Legal hook: CDM 2015 regs 6 (F10), 12 (CPP), site information.
 */

import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import type {
  PreNotificationRequirementResult,
  ConstructionComplianceValidation,
} from "@/lib/construction-compliance-rules";

interface ConstructionCompliancePdfData {
  tenantName: string;
  tenantOrgNumber?: string | null;
  tenantLogoUrl?: string | null;
  project: {
    id: string;
    name: string;
    location: string | null;
    clientName: string | null;
  };
  shaPlan: {
    status: string;
    builderName: string | null;
    builderRepresentativeName: string | null;
    builderRepresentativeContact: string | null;
    coordinatorPlanningName: string | null;
    coordinatorExecutionName: string | null;
    conflictAssessmentDocumented: boolean;
    availableOnSite: boolean;
    lastReviewedAt: Date | null;
  } | null;
  preNotification: {
    status: string;
    submissionDate: Date | null;
    projectAddress: string;
    projectType: string;
    builderName: string;
    builderOrgNumber: string | null;
    expectedStartDate: Date;
    expectedEndDate: Date | null;
    maxWorkersSimultaneous: number | null;
    plannedBusinessesCount: number | null;
    visibleAtSite: boolean;
  } | null;
  rosterEntries: Array<{
    fullName: string;
    birthDate: Date;
    employerName: string;
    employerOrgNumber: string | null;
    hmsCardNumber: string | null;
    startedAtSiteDate: Date | null;
    endedAtSiteDate: Date | null;
    isActive: boolean;
  }>;
  rosterChecks: Array<{
    checkedDate: Date;
    checkedBy: { name: string | null; email: string } | null;
    notes: string | null;
  }>;
  isDailyCheckMissing: boolean;
  preNotificationRequirement: PreNotificationRequirementResult;
  complianceValidation: ConstructionComplianceValidation;
}

function fmt(date: Date | null | undefined): string {
  if (!date) return "–";
  return format(new Date(date), "d MMM yyyy", { locale: enGB });
}

export async function generateConstructionCompliancePdf(
  data: ConstructionCompliancePdfData
): Promise<Buffer> {
  const cv = data.complianceValidation;
  const pnr = data.preNotificationRequirement;

  const sections: PdfSection[] = [
    {
      title: "Project and CDM status",
      legalRef: "CDM 2015 regs 6, 12",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Project", data.project.name],
            ["Site", data.project.location ?? "–"],
            ["Client", data.project.clientName ?? "–"],
            ["Daily check", data.isDailyCheckMissing ? "Missing today" : "Recorded today"],
            ["Last check", data.rosterChecks[0] ? fmt(data.rosterChecks[0].checkedDate) : "None recorded"],
            ["CPP ready", cv.shaReadyForActive ? "Yes" : "No"],
            ["F10 ready", cv.preNotificationReadyForSubmission ? "Yes" : "No"],
            ["F10 notifiable", pnr.isRequired ? "Yes" : "No"],
          ],
        },
        ...(data.isDailyCheckMissing
          ? [{ type: "alert" as const, text: "Daily check is missing — the site register has not been confirmed today.", severity: "warning" as const }]
          : []),
      ],
    },
  ];

  if (data.shaPlan) {
    sections.push({
      title: "Construction Phase Plan",
      legalRef: "CDM 2015 reg. 12",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Status", data.shaPlan.status],
            ["Client", data.shaPlan.builderName ?? "–"],
            ["Client contact", data.shaPlan.builderRepresentativeName ?? "–"],
            ["Principal Designer", data.shaPlan.coordinatorPlanningName ?? "–"],
            ["Principal Contractor", data.shaPlan.coordinatorExecutionName ?? "–"],
            ["Competence / appointment recorded", data.shaPlan.conflictAssessmentDocumented ? "Yes" : "No"],
            ["Available on site", data.shaPlan.availableOnSite ? "Yes" : "No"],
            ["Last reviewed", fmt(data.shaPlan.lastReviewedAt)],
          ],
        },
      ],
    });
  }

  if (data.preNotification) {
    sections.push({
      title: "F10 notification",
      legalRef: "CDM 2015 reg. 6",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Status", data.preNotification.status],
            ["Site address", data.preNotification.projectAddress],
            ["Description of the project", data.preNotification.projectType],
            ["Client", data.preNotification.builderName],
            ["Company number", data.preNotification.builderOrgNumber ?? "–"],
            ["Start date", fmt(data.preNotification.expectedStartDate)],
            ["End date", fmt(data.preNotification.expectedEndDate)],
            ["Maximum workers", data.preNotification.maxWorkersSimultaneous?.toString() ?? "–"],
            ["F10 displayed on site", data.preNotification.visibleAtSite ? "Yes" : "No"],
          ],
        },
      ],
    });
  }

  sections.push({
    title: `Site register (${data.rosterEntries.length} people)`,
    legalRef: "CDM 2015 site information",
    content: data.rosterEntries.length > 0
      ? [{
          type: "table" as const,
          headers: ["Name", "Employer", "CSCS / card", "Start", "End", "Status"],
          rows: data.rosterEntries.map((e) => [
            e.fullName,
            e.employerName,
            e.hmsCardNumber ?? "Missing",
            fmt(e.startedAtSiteDate),
            fmt(e.endedAtSiteDate),
            e.isActive ? "Active" : "Closed",
          ]),
        }]
      : [{ type: "paragraph" as const, text: "No people on the site register." }],
  });

  if (data.rosterChecks.length > 0) {
    sections.push({
      title: "Daily check history",
      content: [
        {
          type: "table",
          headers: ["Date", "Checked by", "Notes"],
          rows: data.rosterChecks.map((c) => [
            fmt(c.checkedDate),
            c.checkedBy?.name ?? c.checkedBy?.email ?? "Unknown",
            c.notes ?? "–",
          ]),
        },
      ],
    });
  }

  return generateBrandedPdf({
    type: "formal",
    reportLabel: "CDM 2015 compliance",
    title: `CDM report – ${data.project.name}`,
    subtitle: "CDM 2015 regs 6 and 12",
    tenant: {
      name: data.tenantName,
      orgNumber: data.tenantOrgNumber,
      logoUrl: data.tenantLogoUrl,
    },
    generatedAt: new Date(),
    legalReference: "CDM 2015 regs 6, 12",
    sections,
  });
}
