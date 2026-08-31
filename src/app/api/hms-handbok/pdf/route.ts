import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPermissions } from "@/lib/permissions";
import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { applyUkPolicyDefaults } from "@/lib/health-safety-policy";
import { dutyLabel } from "@/lib/org-chart-duties";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.role) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const permissions = getPermissions(session.user.role as Role);
  if (!permissions.canReadDocuments && !permissions.canReadRoutines) {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [tenant, handbook, riskAssessments, routines, incidents, trainings, orgNodes] =
    await Promise.all([
      prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { name: true, orgNumber: true, industry: true, hmsContactName: true, hmsContactPhone: true, address: true, logoUrl: true },
      }),
      prisma.hmsHandbook.findUnique({
        where: { tenantId },
        include: {
          reviewedBy: { select: { name: true } },
          branding: true,
        },
      }),
      prisma.riskAssessment.findMany({
        where: { tenantId },
        select: { title: true, assessmentYear: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.routine.findMany({
        where: { tenantId, status: "ACTIVE" },
        select: { title: true, lastReviewedAt: true, nextReviewAt: true },
        orderBy: { title: "asc" },
        take: 30,
      }),
      prisma.incident.findMany({
        where: { tenantId, occurredAt: { gte: thirtyDaysAgo }, status: { not: "CLOSED" } },
        select: { avviksnummer: true, title: true, type: true, occurredAt: true, severity: true },
        orderBy: { occurredAt: "desc" },
        take: 20,
      }),
      prisma.training.findMany({
        where: { tenantId, completedAt: null },
        select: { title: true, validUntil: true },
        orderBy: { validUntil: "asc" },
        take: 20,
      }),
      prisma.orgChartNode.findMany({
        where: { tenantId },
        select: { name: true, title: true, hsDutyKey: true, hsDuty: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  function fmtDate(d: Date | string | null | undefined) {
    if (!d) return "–";
    return format(new Date(d), "d. MMM yyyy", { locale: enGB });
  }

  // Current version: currentVersionId, then latest APPROVED. Employees never download a draft.
  const canManagePolicy =
    permissions.canUpdateSettings || permissions.canApproveDocuments;

  let currentVersion = handbook?.currentVersionId
    ? await prisma.handbookVersion.findUnique({
        where: { id: handbook.currentVersionId },
        include: {
          approvedBy: { select: { name: true } },
          sections: { orderBy: { sortOrder: "asc" } },
          signatures: {
            include: { user: { select: { name: true, email: true } } },
            orderBy: { signedAt: "desc" },
          },
        },
      })
    : null;

  if ((!currentVersion || (!canManagePolicy && currentVersion.status !== "APPROVED")) && handbook) {
    currentVersion = await prisma.handbookVersion.findFirst({
      where: { handbookId: handbook.id, status: "APPROVED" },
      orderBy: { publishedAt: "desc" },
      include: {
        approvedBy: { select: { name: true } },
        sections: { orderBy: { sortOrder: "asc" } },
        signatures: {
          include: { user: { select: { name: true, email: true } } },
          orderBy: { signedAt: "desc" },
        },
      },
    });
  }

  const branding = handbook?.branding;
  const versionLabel = currentVersion ? `v${currentVersion.version}` : "";

  const sections: PdfSection[] = [];

  const totalEmployees = await prisma.userTenant.count({
    where: { tenantId },
  });
  const signatureCount = currentVersion?.signatures?.length ?? 0;

  const statusLabel: Record<string, string> = {
    APPROVED: "Published",
    DRAFT: "Draft — not published",
    PENDING_APPROVAL: "Ready to publish",
    ARCHIVED: "Archived",
  };

  sections.push({
    title: "About the organisation",
    legalRef: "HSWA 1974 s.2(3)",
    content: [
      {
        type: "keyvalue",
        pairs: [
          ["Organisation", tenant.name],
          ["Company no.", tenant.orgNumber ?? "–"],
          ["Industry", tenant.industry ?? "–"],
          ["Address", tenant.address ?? "–"],
          ["H&S contact", tenant.hmsContactName ?? "–"],
          ["H&S phone", tenant.hmsContactPhone ?? "–"],
        ],
      },
    ],
  });

  // Status og godkjenning
  const statusContent: PdfSection["content"] = [];

  if (currentVersion) {
    statusContent.push({
      type: "status-badge",
      label: "Status",
      status: currentVersion.status === "APPROVED" ? "ok" : currentVersion.status === "DRAFT" ? "warning" : "info",
    });
    statusContent.push({
      type: "keyvalue",
      pairs: [
        ["Version", currentVersion.version],
        ["Status", statusLabel[currentVersion.status] ?? currentVersion.status],
        ["Published by", currentVersion.approvedBy?.name ?? "–"],
        ["Published", currentVersion.status === "APPROVED" ? fmtDate(currentVersion.approvedAt) : "Not published"],
        ["Last reviewed", handbook?.lastReviewedAt ? fmtDate(handbook.lastReviewedAt) : "–"],
        ["Employees notified", `${signatureCount} of ${totalEmployees}${signatureCount >= totalEmployees && totalEmployees > 0 ? " (all)" : ""}`],
      ],
    });
  } else {
    statusContent.push({
      type: "alert",
      text: "This health and safety policy has not been published. Create and publish a version so employees can be given notice of the written policy (HSWA 1974 s.2(3)).",
      severity: "warning",
    });
  }

  sections.push({
    title: "Status and publication",
    legalRef: "HSWA 1974 s.2(3)",
    content: statusContent,
  });

  const namedDuties = orgNodes.filter((node) => node.hsDutyKey && node.name);
  sections.push({
    title: "Organisation — who does what",
    legalRef: "HSWA 1974 s.2(3) Part 2",
    content: namedDuties.length > 0
      ? [{
          type: "table" as const,
          headers: ["Name", "Position", "H&S duty", "What they do"],
          rows: namedDuties.map((node) => [
            node.name ?? "–",
            node.title,
            dutyLabel(node.hsDutyKey) ?? "–",
            node.hsDuty ?? "–",
          ]),
        }]
      : [{
          type: "alert" as const,
          text: "No named health and safety duty holders on the organisation chart. HSE asks for names, positions and roles.",
          severity: "warning" as const,
        }],
  });

  // Dynamiske seksjoner fra versjonskontroll
  if (currentVersion && currentVersion.sections.length > 0) {
    for (const section of currentVersion.sections) {
      if (section.parentId) continue;

      const displaySection = applyUkPolicyDefaults(section);

      const childSections = currentVersion.sections.filter(
        (s) => s.parentId === section.id,
      );

      const contentBlocks: PdfSection["content"] = [];

      if (displaySection.content && displaySection.content.trim() !== "<p></p>") {
        contentBlocks.push({ type: "html", html: displaySection.content });
      }

      if (childSections.length > 0) {
        for (const child of childSections) {
          const displayChild = applyUkPolicyDefaults(child);
          contentBlocks.push({
            type: "html",
            html: `<h4>${displayChild.sectionNumber} ${displayChild.title}</h4>${displayChild.content}`,
          });
        }
      }

      if (contentBlocks.length === 0) {
        contentBlocks.push({ type: "paragraph", text: "Not completed." });
      }

      sections.push({
        title: `${displaySection.sectionNumber}. ${displaySection.title}`,
        legalRef: displaySection.legalRef ?? undefined,
        content: contentBlocks,
      });
    }
  } else {
    // Fallback: live data som før
    sections.push(
      {
        title: "Risk assessments",
        legalRef: "MHSWR 1999 reg.3",
        content: riskAssessments.length > 0
          ? [{
              type: "table" as const,
              headers: ["Title", "Year", "Last updated"],
              rows: riskAssessments.map((r) => [r.title, r.assessmentYear?.toString() ?? "–", fmtDate(r.updatedAt)]),
            }]
          : [{ type: "alert" as const, text: "No risk assessments recorded yet.", severity: "info" as const }],
      },
      {
        title: "Procedures",
        legalRef: "HSWA 1974 s.2(3) arrangements",
        content: routines.length > 0
          ? [{
              type: "table" as const,
              headers: ["Procedure", "Last reviewed", "Next review"],
              rows: routines.map((r) => [r.title, fmtDate(r.lastReviewedAt), fmtDate(r.nextReviewAt)]),
            }]
          : [{ type: "alert" as const, text: "No active procedures.", severity: "info" as const }],
      },
      {
        title: "Open incidents (last 30 days)",
        legalRef: "RIDDOR 2013; accident book",
        content: incidents.length > 0
          ? [{
              type: "table" as const,
              headers: ["Ref.", "Title", "Type", "Date", "Severity"],
              rows: incidents.map((i) => [i.avviksnummer ?? "–", i.title, i.type, fmtDate(i.occurredAt), i.severity ?? "–"]),
            }]
          : [{ type: "alert" as const, text: "No open incidents in the last 30 days.", severity: "info" as const }],
      },
      {
        title: "Outstanding training",
        legalRef: "HSWA 1974 s.2(2)(c)",
        content: trainings.length > 0
          ? [{
              type: "table" as const,
              headers: ["Training", "Due"],
              rows: trainings.map((t) => [t.title, fmtDate(t.validUntil)]),
            }]
          : [{ type: "alert" as const, text: "No outstanding training records.", severity: "info" as const }],
      },
    );
  }

  // Signaturliste fra versjon
  const versionSignatures = currentVersion?.signatures ?? [];
  const signedUserIds = new Set(versionSignatures.map((s) => s.userId));

  const allEmployees = await prisma.userTenant.findMany({
    where: { tenantId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const unsignedEmployees = allEmployees.filter((e) => !signedUserIds.has(e.userId));

  const signatureContent: PdfSection["content"] = [];

  if (versionSignatures.length > 0) {
    signatureContent.push({
      type: "signature-block",
      signatures: versionSignatures.map((s) => ({
        name: s.user.name ?? s.user.email,
        date: fmtDate(s.signedAt),
        comment: s.comment ?? undefined,
      })),
    });
  }

  if (unsignedEmployees.length > 0) {
    signatureContent.push({
      type: "alert",
      text: `${unsignedEmployees.length} employee${unsignedEmployees.length > 1 ? "s have" : " has"} not confirmed notification: ${unsignedEmployees.map((e) => e.user.name ?? e.user.email).join(", ")}`,
      severity: versionSignatures.length === 0 ? "danger" : "warning",
    });
  } else if (versionSignatures.length > 0) {
    signatureContent.push({
      type: "alert",
      text: "All employees have confirmed they have been notified of this version.",
      severity: "info",
    });
  }

  sections.push({
    title: `Acknowledgements — ${signatureCount} of ${totalEmployees} notified`,
    legalRef: "HSWA 1974 s.2(3)",
    content: signatureContent.length > 0
      ? signatureContent
      : [{ type: "alert" as const, text: "No acknowledgements recorded for this version.", severity: "warning" as const }],
  });

  // Endringslogg
  const allVersions = await prisma.handbookVersion.findMany({
    where: { handbook: { tenantId } },
    orderBy: { createdAt: "desc" },
    include: {
      approvedBy: { select: { name: true } },
      _count: { select: { signatures: true } },
    },
  });

  if (allVersions.length > 1) {
    sections.push({
      title: "Change log",
      legalRef: "HSWA 1974 s.2(3) — revise as appropriate",
      content: [
        {
          type: "table" as const,
          headers: ["Version", "Status", "Change note", "Published by", "Date", "Acknowledgements"],
          rows: allVersions.map((v) => [
            v.version,
            statusLabel[v.status] ?? v.status,
            v.changeNote ?? "–",
            v.approvedBy?.name ?? "–",
            fmtDate(v.approvedAt ?? v.createdAt),
            v._count.signatures.toString(),
          ]),
        },
      ],
    });
  }

  const headerText = branding?.headerText ?? `Health and safety policy ${new Date().getFullYear()}`;

  const pdfBuffer = await generateBrandedPdf({
    type: "formal",
    reportLabel: "HEALTH AND SAFETY POLICY",
    title: `${headerText} — ${tenant.name}`,
    subtitle: currentVersion
      ? `Version ${currentVersion.version} · ${statusLabel[currentVersion.status] ?? currentVersion.status} · Generated ${fmtDate(now)} · HSWA 1974 s.2(3)`
      : `Generated ${fmtDate(now)} · HSWA 1974 s.2(3)`,
    tenant: {
      name: tenant.name,
      orgNumber: tenant.orgNumber,
      address: tenant.address,
      logoUrl: branding?.logoUrl ?? tenant.logoUrl,
    },
    generatedBy: session.user.name ?? session.user.email ?? "Unknown",
    generatedAt: now,
    legalReference: "HSWA 1974 s.2(3); HSE INDG259",
    sections,
  });

  const filename = `health-and-safety-policy-${tenant.name.replace(/[^a-zA-Z0-9]/g, "-")}-${versionLabel}-${format(now, "yyyy-MM-dd")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.byteLength.toString(),
    },
  });
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "  • ")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
