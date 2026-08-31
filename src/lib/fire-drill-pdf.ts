/**
 * Fire drill record — Fire Safety Order 2005 arts 15, 21 and 22.
 * Kept by the responsible person. Not submitted to the HSE.
 */

import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import {
  FIRE_DRILL_STATUS_LABELS,
  FIRE_DRILL_TYPE_LABELS,
  OBJECTIVES_ACHIEVED_LABELS,
  fireDrillTypeLabel,
  formatEvacuationTime,
  type NamedFireMarshal,
} from "@/lib/fire-drill-uk";

export interface FireDrillReportData {
  id: string;
  title: string;
  drillType: string;
  isAnnounced: boolean;
  status: string;
  plannedDate: Date;
  completedAt: Date | null;
  location: string;
  responsibleName: string;
  fireMarshals: NamedFireMarshal[];
  objectives: string;
  scenario: string | null;
  riskAssessment: string | null;
  actualParticipantCount: number | null;
  evacuationTimeSeconds: number | null;
  observations: string | null;
  objectivesAchieved: string | null;
  evaluation: string | null;
  improvementPoints: string | null;
  procedureChangesNeeded: boolean | null;
  procedureChangesDesc: string | null;
  evaluatedByName: string | null;
  evaluatedAt: Date | null;
  sharedPremises?: boolean | null;
  buildingOwnerName?: string | null;
  measures: Array<{
    title: string;
    status: string;
    dueAt: Date;
    responsibleName: string | null;
  }>;
  tenantName: string;
  tenantOrgNumber?: string | null;
  tenantLogoUrl?: string | null;
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "–";
  return format(new Date(d), "d MMMM yyyy", { locale: enGB });
}

function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "–";
  return format(new Date(d), "d MMMM yyyy, HH:mm", { locale: enGB });
}

export async function generateFireDrillReport(data: FireDrillReportData): Promise<Buffer> {
  const marshalLine =
    data.fireMarshals.length > 0
      ? data.fireMarshals.map((marshal) => `${marshal.name} (${marshal.title})`).join(", ")
      : "Not named on the organisation chart";

  const sections: PdfSection[] = [
    {
      title: "Drill record",
      legalRef: "Fire Safety Order 2005 arts 15, 21 and 22",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Type", FIRE_DRILL_TYPE_LABELS[data.drillType as keyof typeof FIRE_DRILL_TYPE_LABELS] ?? data.drillType],
            [
              "Status",
              FIRE_DRILL_STATUS_LABELS[data.status as keyof typeof FIRE_DRILL_STATUS_LABELS] ?? data.status,
            ],
            ["Announced", data.isAnnounced ? "Yes" : "No — unannounced"],
            ["Planned", fmtDateTime(data.plannedDate)],
            ...(data.completedAt ? [["Carried out", fmtDateTime(data.completedAt)] as [string, string]] : []),
            ["Premises / location", data.location],
            ["Person in charge", data.responsibleName],
            ["Nominated fire marshals (art.15(1)(b))", marshalLine],
            ...(data.actualParticipantCount != null
              ? [["People taking part", String(data.actualParticipantCount)] as [string, string]]
              : []),
            ...(data.evacuationTimeSeconds != null
              ? [["Time to evacuate", formatEvacuationTime(data.evacuationTimeSeconds)] as [string, string]]
              : []),
            ...(data.objectivesAchieved
              ? [[
                  "Outcome",
                  OBJECTIVES_ACHIEVED_LABELS[
                    data.objectivesAchieved as keyof typeof OBJECTIVES_ACHIEVED_LABELS
                  ] ?? data.objectivesAchieved,
                ] as [string, string]]
              : []),
            ...(data.sharedPremises
              ? [[
                  "Shared premises (art.22)",
                  data.buildingOwnerName
                    ? `Co-ordinated with ${data.buildingOwnerName}`
                    : "Yes — more than one responsible person",
                ] as [string, string]]
              : []),
          ] as [string, string][],
        },
      ],
    },
    {
      title: "Objectives",
      content: [{ type: "paragraph", text: data.objectives }],
    },
  ];

  if (data.scenario) {
    sections.push({
      title: "Scenario",
      content: [{ type: "paragraph", text: data.scenario }],
    });
  }

  if (data.riskAssessment) {
    sections.push({
      title: "Link to the fire risk assessment",
      content: [{ type: "paragraph", text: data.riskAssessment }],
    });
  }

  if (data.observations) {
    sections.push({
      title: "Observations",
      content: [{ type: "paragraph", text: data.observations }],
    });
  }

  if (data.evaluation) {
    sections.push({
      title: "Review",
      content: [{ type: "paragraph", text: data.evaluation }],
    });
  }

  if (data.improvementPoints) {
    sections.push({
      title: "Improvements",
      content: [{ type: "paragraph", text: data.improvementPoints }],
    });
  }

  if (data.procedureChangesNeeded) {
    sections.push({
      title: "Changes to evacuation procedures",
      legalRef: "Fire Safety Order 2005 art.15",
      content: [
        {
          type: "alert",
          text: data.procedureChangesDesc ?? "Procedure changes are required — see the actions.",
          severity: "warning",
        },
      ],
    });
  }

  if (data.measures.length > 0) {
    sections.push({
      title: "Follow-up actions",
      content: [
        {
          type: "table",
          headers: ["Action", "Status", "Due", "Owner"],
          rows: data.measures.map((measure) => [
            measure.title,
            measure.status,
            fmtDate(measure.dueAt),
            measure.responsibleName ?? "–",
          ]),
        },
      ],
    });
  }

  if (data.evaluatedByName) {
    sections.push({
      title: "Reviewed by",
      content: [
        {
          type: "signature-block",
          signatures: [
            {
              name: data.evaluatedByName,
              date: fmtDate(data.evaluatedAt),
            },
          ],
        },
      ],
    });
  }

  return generateBrandedPdf({
    type: "operational",
    reportLabel: "Fire drill record",
    title: data.title,
    subtitle: `${fireDrillTypeLabel(data.drillType)} · ${fmtDateTime(data.completedAt ?? data.plannedDate)}`,
    tenant: {
      name: data.tenantName,
      orgNumber: data.tenantOrgNumber,
      logoUrl: data.tenantLogoUrl,
    },
    generatedBy: data.responsibleName,
    generatedAt: new Date(),
    legalReference:
      "Regulatory Reform (Fire Safety) Order 2005 arts 15, 21 and 22. Internal record — not submitted to the HSE.",
    sections,
  });
}
