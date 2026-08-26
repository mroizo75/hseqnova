import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { getPermissions } from "@/lib/permissions";
import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import type { Role } from "@prisma/client";
import { getIncidentTypeLabel } from "@/features/incidents/schemas/incident.schema";
import { loadIncidentDetail } from "@/server/queries/incidents.queries";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Recorded",
  INVESTIGATING: "Under investigation",
  ACTION_TAKEN: "Action taken",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "–";
  return format(new Date(d), "d MMMM yyyy", { locale: enGB });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.role) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const permissions = getPermissions(session.user.role as Role);
  if (!permissions.canReadIncidents && !permissions.canReadOwnIncidents) {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }

  const { id } = await params;
  const tenantId = session.user.tenantId;

  const incident = await loadIncidentDetail({
    id,
    tenantId,
    reportedBy: permissions.canReadIncidents ? undefined : session.user.id,
  });

  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("name, orgNumber, address, logoUrl")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  const now = new Date();
  const severity = incident.severity;
  const typeLabel = getIncidentTypeLabel(incident.type);

  const sections: PdfSection[] = [
    {
      title: "Accident book details",
      legalRef: "SSCPR 1979; RIDDOR 2013; HSWA 1974 s.2",
      content: [
        {
          type: "keyvalue",
          pairs: [
            ["Reference", incident.avviksnummer ?? "–"],
            ["Type", typeLabel],
            ["Status", STATUS_LABELS[incident.status] ?? incident.status],
            ...(severity != null ? [["Severity", `${severity}/5`] as [string, string]] : []),
            ["Date", fmtDate(incident.occurredAt)],
            ["Recorded", fmtDate(incident.createdAt)],
            ...(incident.location ? [["Location", incident.location] as [string, string]] : []),
            ...(incident.witnessName ? [["Witness", incident.witnessName] as [string, string]] : []),
            ...(incident.closedAt ? [["Closed", fmtDate(incident.closedAt)] as [string, string]] : []),
            ...(incident.riddorReportable
              ? [["RIDDOR", incident.riddorCategory ?? "Reportable"] as [string, string]]
              : []),
          ] as [string, string][],
        },
        { type: "paragraph", text: incident.description },
      ],
    },
  ];

  if (incident.immediateAction) {
    sections.push({
      title: "Immediate actions",
      legalRef: "MHSWR 1999; HSE HSG245",
      content: [{ type: "paragraph", text: incident.immediateAction }],
    });
  }

  if (incident.rootCause || incident.contributingFactors) {
    sections.push({
      title: "Investigation",
      legalRef: "HSE HSG245 Investigating accidents and incidents",
      content: [
        ...(incident.rootCause
          ? [{ type: "keyvalue" as const, pairs: [["Investigation findings", incident.rootCause] as [string, string]] }]
          : []),
        ...(incident.contributingFactors
          ? [{ type: "paragraph" as const, text: `Contributing factors:\n${incident.contributingFactors}` }]
          : []),
      ],
    });
  }

  if (incident.measures.length > 0) {
    sections.push({
      title: "Actions and follow-up",
      content: [
        {
          type: "table",
          headers: ["Action", "Status", "Owner", "Due"],
          rows: incident.measures.map((measure) => [
            measure.title,
            measure.status,
            measure.responsible?.name ?? "–",
            fmtDate(measure.dueAt),
          ]),
        },
      ],
    });
  }

  if (incident.effectivenessReview) {
    sections.push({
      title: "Effectiveness review",
      content: [{ type: "paragraph", text: incident.effectivenessReview }],
    });
  }

  if (incident.lessonsLearned) {
    sections.push({
      title: "Lessons learned",
      content: [{ type: "paragraph", text: incident.lessonsLearned }],
    });
  }

  if (incident.riddorReportable || incident.type === "ULYKKE" || incident.type === "YRKESSYKDOM") {
    sections.push({
      content: [
        {
          type: "alert",
          text: "RIDDOR 2013: if this event is reportable, submit the official report on hse.gov.uk/riddor. This PDF is a summary pack, not the HSE submission.",
          severity: "info",
        },
      ],
    });
    if (incident.isFatal) {
      sections.push({
        content: [
          {
            type: "alert",
            text: "DEATH: report to HSE without delay (RIDDOR 2013). Also notify the police where required.",
            severity: "danger",
          },
        ],
      });
    }
  }

  const pdfBuffer = await generateBrandedPdf({
    type: "formal",
    reportLabel: typeLabel,
    title: incident.title,
    subtitle: `${STATUS_LABELS[incident.status] ?? incident.status} · ${fmtDate(incident.occurredAt)} · Ref: ${incident.avviksnummer ?? id}`,
    tenant: {
      name: tenant.name,
      orgNumber: tenant.orgNumber,
      address: tenant.address,
      logoUrl: tenant.logoUrl,
    },
    generatedBy: session.user.name ?? session.user.email ?? "Unknown",
    generatedAt: now,
    legalReference: "RIDDOR 2013; SSCPR 1979; HSWA 1974 s.2; ISO 45001 cl. 10.2",
    sections,
  });

  const filename = `Accident-book-${incident.avviksnummer ?? id}-${format(now, "yyyy-MM-dd")}.pdf`;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.byteLength.toString(),
    },
  });
}
