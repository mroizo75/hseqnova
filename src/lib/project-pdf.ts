/**
 * PDF generator for project HSEQ reports.
 * Legal hook: HSWA 1974 s.2; CDM 2015 for construction sites.
 */

import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

interface ProjectReportData {
  project: {
    id: string;
    name: string;
    code: string | null;
    orderNumber: string | null;
    clientName: string | null;
    location: string | null;
    description: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    projectManager: { name: string | null; email: string } | null;
    createdBy: { name: string | null; email: string };
    createdAt: Date;
  };
  incidents: Array<{
    avviksnummer: string | null;
    title: string;
    type: string;
    severity: number | null;
    status: string;
    occurredAt: Date;
    isFatal: boolean;
    isLostTimeIncident: boolean;
    lostWorkdays: number | null;
    isRestrictedWork: boolean;
    medicalAttentionRequired: boolean;
  }>;
  sjaAnalyses: Array<{
    sjaNummer: string | null;
    title: string;
    status: string;
    plannedDate: Date;
    workLocation: string;
    responsibleName: string;
    conclusion: string;
  }>;
  inspections: Array<{
    title: string;
    type: string;
    status: string;
    scheduledDate: Date;
    location: string | null;
  }>;
  measures: Array<{
    title: string;
    status: string;
    dueAt: Date;
    category: string;
  }>;
  attachments: Array<{
    name: string;
    mime: string;
    size: number | null;
    createdAt: Date;
  }>;
  manHours: number;
  tenantName: string;
  tenantOrgNumber?: string | null;
  tenantLogoUrl?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  ULYKKE: "Accident",
  NESTEN: "Near miss",
  FARLIG_SITUASJON: "Unsafe condition",
  YRKESSYKDOM: "Occupational disease",
  AVVIK: "Incident",
};

function fmt(d: Date | null | undefined): string {
  if (!d) return "–";
  return format(new Date(d), "d MMM yyyy", { locale: enGB });
}

export async function generateProjectReport(data: ProjectReportData): Promise<Buffer> {
  const { project } = data;
  const pm = project.projectManager?.name ?? project.projectManager?.email ?? "–";

  const sections: PdfSection[] = [
    {
      title: "Project information",
      legalRef: "HSWA 1974 s.2; CDM 2015",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Project name", project.name],
            ["Project code", project.code ?? "–"],
            ["Order number", project.orderNumber ?? "–"],
            ["Client", project.clientName ?? "–"],
            ["Location", project.location ?? "–"],
            ["Status", STATUS_LABELS[project.status] ?? project.status],
            ["Start date", fmt(project.startDate)],
            ["End date", fmt(project.endDate)],
            ["Site / project manager", pm],
            ["Hours worked", String(data.manHours)],
          ],
        },
        ...(project.description ? [{ type: "paragraph" as const, text: project.description }] : []),
      ],
    },
  ];

  sections.push({
    title: "HSEQ statistics",
    content: [
      {
        type: "table",
        headers: ["Indicator", "Value"],
        rows: [
          ["Total incidents", data.incidents.length],
          ["Fatal accidents", data.incidents.filter((i) => i.isFatal).length],
          ["Lost-time injuries", data.incidents.filter((i) => i.isLostTimeIncident).length],
          ["Lost workdays", data.incidents.reduce((acc, i) => acc + (i.lostWorkdays ?? 0), 0)],
          ["RAMS", data.sjaAnalyses.length],
          ["Workplace inspections", data.inspections.length],
          ["Open actions", data.measures.filter((m) => m.status !== "DONE").length],
        ],
      },
    ],
  });

  if (data.incidents.length > 0) {
    sections.push({
      title: "Incidents",
      content: [
        {
          type: "table",
          headers: ["Ref.", "Title", "Type", "Date", "Status"],
          rows: data.incidents.map((i) => [
            i.avviksnummer ?? "–",
            i.title,
            INCIDENT_TYPE_LABELS[i.type] ?? i.type,
            fmt(i.occurredAt),
            i.status,
          ]),
        },
      ],
    });
  }

  if (data.sjaAnalyses.length > 0) {
    sections.push({
      title: "RAMS",
      content: [
        {
          type: "table",
          headers: ["RAMS no.", "Title", "Status", "Date", "Responsible"],
          rows: data.sjaAnalyses.map((s) => [
            s.sjaNummer ?? "–",
            s.title,
            s.status,
            fmt(s.plannedDate),
            s.responsibleName,
          ]),
        },
      ],
    });
  }

  if (data.measures.length > 0) {
    sections.push({
      title: "Actions",
      content: [
        {
          type: "table",
          headers: ["Action", "Status", "Due"],
          rows: data.measures.map((m) => [m.title, m.status, fmt(m.dueAt)]),
        },
      ],
    });
  }

  return generateBrandedPdf({
    type: "operational",
    reportLabel: "Project report",
    title: project.name,
    subtitle: `${STATUS_LABELS[project.status] ?? project.status} · ${fmt(project.startDate)} – ${fmt(project.endDate)}`,
    tenant: {
      name: data.tenantName,
      orgNumber: data.tenantOrgNumber,
      logoUrl: data.tenantLogoUrl,
    },
    generatedBy: pm,
    generatedAt: new Date(),
    legalReference: "HSWA 1974 s.2; CDM 2015",
    sections,
  });
}
