/**
 * PDF for a workplace inspection record (HSE F2534 / F2533).
 * Kept internally. Not submitted to the HSE.
 */

import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { inspectionTypeLabel, legalBasisLabel } from "@/lib/inspection-uk";

interface InspectionData {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  scheduledDate: Date;
  completedDate?: Date | null;
  location?: string | null;
  conductedBy: string;
  participants?: string | null;
  legalBasis?: string | null;
  tenantName?: string;
  tenantOrgNumber?: string | null;
  tenantLogoUrl?: string | null;
  findings: Array<{
    id: string;
    title: string;
    description: string;
    severity: number;
    location?: string | null;
    status: string;
    responsibleId?: string | null;
    dueDate?: Date | null;
    createdAt: Date;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const FINDING_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const SEVERITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Moderate",
  3: "Significant",
  4: "Serious",
  5: "Critical",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "–";
  return format(new Date(d), "d MMMM yyyy", { locale: enGB });
}

function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "–";
  return format(new Date(d), "d MMMM yyyy, HH:mm", { locale: enGB });
}

export async function generateInspectionReport(inspection: InspectionData): Promise<Buffer> {
  const openFindings = inspection.findings.filter((f) => f.status === "OPEN").length;

  const sections: PdfSection[] = [
    {
      title: "Inspection record",
      legalRef: "HSE F2534; MHSWR 1999 reg.5; SRSCWR 1977 regs 5–6",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Type", inspectionTypeLabel(inspection.type)],
            ["Legal basis", legalBasisLabel(inspection.legalBasis, inspection.type)],
            ["Status", STATUS_LABELS[inspection.status] ?? inspection.status],
            ["Date and time", fmtDateTime(inspection.scheduledDate)],
            ...(inspection.completedDate
              ? [["Completed", fmtDate(inspection.completedDate)] as [string, string]]
              : []),
            ["Area of workplace", inspection.location ?? "–"],
            ["Inspector / safety representative", inspection.conductedBy],
            ...(inspection.participants
              ? [["Employer or others taking part", inspection.participants] as [string, string]]
              : []),
            ["Findings", String(inspection.findings.length)],
            ["Open findings", String(openFindings)],
          ],
        },
        {
          type: "paragraph",
          text: "This record does not imply that conditions are safe and healthy or that welfare arrangements are satisfactory.",
        },
        ...(inspection.description
          ? [{ type: "paragraph" as const, text: inspection.description }]
          : []),
      ],
    },
  ];

  if (inspection.findings.length > 0) {
    sections.push({
      title: "Unsafe or unhealthy conditions notified",
      legalRef: "HSE F2533",
      content: [
        {
          type: "table",
          headers: ["#", "Finding", "Severity", "Status", "Due"],
          rows: inspection.findings.map((f, i) => [
            i + 1,
            f.title,
            SEVERITY_LABELS[f.severity] ?? String(f.severity),
            FINDING_STATUS_LABELS[f.status] ?? f.status,
            fmtDate(f.dueDate),
          ]),
        },
      ],
    });

    sections.push({
      title: "Particulars of the matters notified",
      content: inspection.findings.flatMap((f, i) => [
        {
          type: "keyvalue" as const,
          pairs: [
            [`${i + 1}. ${f.title}`, ""],
            ["Severity", SEVERITY_LABELS[f.severity] ?? String(f.severity)],
            ["Status", FINDING_STATUS_LABELS[f.status] ?? f.status],
            ...(f.location ? [["Location observed", f.location] as [string, string]] : []),
            ...(f.dueDate ? [["Due date for action", fmtDate(f.dueDate)] as [string, string]] : []),
          ] as [string, string][],
        },
        { type: "paragraph" as const, text: f.description },
      ]),
    });
  }

  if (openFindings > 0) {
    sections.push({
      content: [
        {
          type: "alert",
          text: `${openFindings} finding(s) still need employer action. Explain in writing if action is not appropriate or will be delayed (HSE F2533 / L146).`,
          severity: "warning",
        },
      ],
    });
  }

  return generateBrandedPdf({
    type: "formal",
    reportLabel: inspectionTypeLabel(inspection.type),
    title: inspection.title,
    subtitle: `${STATUS_LABELS[inspection.status] ?? inspection.status} · ${fmtDateTime(inspection.scheduledDate)}`,
    tenant: {
      name: inspection.tenantName ?? "HSEQ Nova",
      orgNumber: inspection.tenantOrgNumber,
      logoUrl: inspection.tenantLogoUrl,
    },
    generatedBy: inspection.conductedBy,
    generatedAt: new Date(),
    legalReference: "MHSWR 1999 reg.5; SRSCWR 1977 regs 5–6; HSE F2534 / F2533. Internal record — not submitted to the HSE.",
    sections,
  });
}
