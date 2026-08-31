/**
 * RIDDOR F2508 Report PDF Generator
 *
 * Generates a PDF matching the HSE F2508 notification form structure.
 * Uses the branded PDF pipeline from pdf-brand.ts.
 *
 * @see https://www.hse.gov.uk/riddor/report.htm
 * @see Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013
 */

import { generateBrandedPdf, type PdfSection, type PdfContent } from "@/lib/pdf-brand";
import type { RiddorCategory } from "@/lib/riddor";

export interface F2508Data {
  notifierName: string;
  notifierJobTitle: string;
  notifierPhone: string;
  notifierEmail: string;

  incidentDate: Date;
  incidentTime: string;
  incidentLocation: string;
  localAuthority: string;

  injuredPersonName?: string;
  injuredPersonDob?: Date;
  injuredPersonOccupation?: string;
  injuredPersonEmploymentStatus?: string;

  incidentType: RiddorCategory;
  injuryDescription?: string;
  bodyPartAffected?: string;

  description: string;

  organisationName: string;
  organisationAddress: string;

  internalRef?: string;
  riddorReference?: string;
  riddorDueAt?: Date;
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  death: "Death",
  specified_injury: "Specified injury (reg. 4)",
  over_seven_day: "Over-seven-day incapacitation (reg. 4)",
  occupational_disease: "Occupational disease (reg. 8)",
  dangerous_occurrence: "Dangerous occurrence (Schedule 2)",
  non_worker: "Injury to a non-worker taken to hospital",
};

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  employee: "Employee",
  "self-employed": "Self-employed",
  "member_of_public": "Member of the public",
  trainee: "Trainee / work experience",
};

function formatDate(date: Date | undefined | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildPartA(data: F2508Data): PdfSection {
  const pairs: [string, string | null | undefined][] = [
    ["Name", data.notifierName],
    ["Job title", data.notifierJobTitle],
    ["Telephone", data.notifierPhone],
    ["Email", data.notifierEmail],
  ];

  return {
    title: "Part A — About you (the notifier)",
    legalRef: "RIDDOR 2013 reg. 3",
    content: [{ type: "keyvalue", pairs }],
  };
}

function buildPartB(data: F2508Data): PdfSection {
  const content: PdfContent[] = [
    {
      type: "keyvalue",
      pairs: [
        ["Date of incident", formatDate(data.incidentDate)],
        ["Time of incident", data.incidentTime || "—"],
        ["Location", data.incidentLocation || "—"],
        ["Local authority area", data.localAuthority || "—"],
      ],
    },
  ];

  return {
    title: "Part B — About the incident",
    legalRef: "RIDDOR 2013 reg. 3(2)",
    content,
  };
}

function buildPartC(data: F2508Data): PdfSection {
  const pairs: [string, string | null | undefined][] = [
    ["Name", data.injuredPersonName ?? "—"],
    ["Date of birth", formatDate(data.injuredPersonDob)],
    ["Occupation", data.injuredPersonOccupation ?? "—"],
    [
      "Employment status",
      data.injuredPersonEmploymentStatus
        ? EMPLOYMENT_STATUS_LABELS[data.injuredPersonEmploymentStatus] ??
          data.injuredPersonEmploymentStatus
        : "—",
    ],
  ];

  return {
    title: "Part C — About the injured person",
    legalRef: "RIDDOR 2013 reg. 4–6",
    content: [{ type: "keyvalue", pairs }],
  };
}

function buildPartD(data: F2508Data): PdfSection {
  const typeLabel = data.incidentType
    ? INCIDENT_TYPE_LABELS[data.incidentType] ?? data.incidentType
    : "Not classified";

  const content: PdfContent[] = [
    {
      type: "keyvalue",
      pairs: [
        ["Type of reportable incident", typeLabel],
        ["Nature of injury / disease", data.injuryDescription ?? "—"],
        ["Body part affected", data.bodyPartAffected ?? "—"],
      ],
    },
  ];

  if (data.riddorDueAt) {
    content.push({
      type: "alert",
      text: `Reporting deadline: ${formatDate(data.riddorDueAt)}`,
      severity: new Date() > data.riddorDueAt ? "danger" : "warning",
    });
  }

  return {
    title: "Part D — About the injury or condition",
    legalRef: "RIDDOR 2013 reg. 4, 8, Schedule 1–2",
    content,
  };
}

function buildPartE(data: F2508Data): PdfSection {
  return {
    title: "Part E — Description of what happened",
    legalRef: "RIDDOR 2013 reg. 3(2)(d)",
    content: [{ type: "paragraph", text: data.description || "No description provided." }],
  };
}

function buildOrganisationSection(data: F2508Data): PdfSection {
  return {
    title: "Organisation details",
    content: [
      {
        type: "keyvalue",
        pairs: [
          ["Organisation", data.organisationName],
          ["Address", data.organisationAddress || "—"],
        ],
      },
    ],
  };
}

function buildReferenceSection(data: F2508Data): PdfSection {
  const pairs: [string, string | null | undefined][] = [
    ["Internal reference", data.internalRef ?? "—"],
  ];
  if (data.riddorReference) {
    pairs.push(["RIDDOR reference", data.riddorReference]);
  }

  return {
    title: "References",
    content: [{ type: "keyvalue", pairs }],
  };
}

export async function generateF2508Pdf(data: F2508Data): Promise<Buffer> {
  const sections: PdfSection[] = [
    buildPartA(data),
    buildPartB(data),
    buildPartC(data),
    buildPartD(data),
    buildPartE(data),
    buildOrganisationSection(data),
    buildReferenceSection(data),
  ];

  return generateBrandedPdf({
    type: "formal",
    title: "RIDDOR Report — F2508",
    subtitle: "Notification of an accident, dangerous occurrence or case of disease",
    reportLabel: "F2508",
    tenant: {
      name: data.organisationName,
      address: data.organisationAddress,
    },
    generatedAt: new Date(),
    legalReference: "Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013",
    sections,
  });
}
