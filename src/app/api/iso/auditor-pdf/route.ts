import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";
import { getEnabledModuleKeys } from "@/lib/require-tenant-module";
import { tenantHasIsoPack } from "@/lib/tenant-modules";
import { loadIsoEvidenceSnapshot } from "@/server/queries/iso.queries";
import { evaluateIsoClauses } from "@/features/iso/lib/evidence";
import { generateBrandedPdf, type PdfSection } from "@/lib/pdf-brand";
import { getAdminDb } from "@/lib/supabase/admin";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.role) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const permissions = getPermissions(session.user.role as Role);
  if (!permissions.canReadAudits) {
    return NextResponse.json({ error: "No access" }, { status: 403 });
  }
  const tenantId = session.user.tenantId;
  const enabled = await getEnabledModuleKeys(tenantId);
  if (!tenantHasIsoPack(enabled)) {
    return NextResponse.json({ error: "ISO pack is not enabled" }, { status: 403 });
  }

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("name, orgNumber, companyNumber, address")
    .eq("id", tenantId)
    .maybeSingle();

  const snapshot = await loadIsoEvidenceSnapshot(tenantId, enabled);
  const statuses = evaluateIsoClauses(snapshot);
  const sections: PdfSection[] = [
    {
      title: "Purpose of this pack",
      legalRef: "ISO 45001:2018 / ISO 9001:2015",
      content: [
        {
          type: "paragraph",
          text: "This pack maps live HSEQ Nova records to ISO 45001 and ISO 9001 clauses for a UKAS certification audit. It is not an HSE return. Certification is granted to the organisation by a UKAS-accredited body.",
        },
      ],
    },
    ...statuses.map((item) => ({
      title: `${item.clause.standard === "ISO_45001" ? "ISO 45001" : "ISO 9001"} ${item.clause.clause} — ${item.clause.title}`,
      legalRef: item.clause.shall,
      content: [
        { type: "paragraph" as const, text: `Status: ${item.level}. ${item.detail}` },
        { type: "paragraph" as const, text: `Show the auditor: ${item.clause.auditorHint}` },
      ],
    })),
  ];

  const pdf = await generateBrandedPdf({
    title: "ISO 45001 & 9001 evidence pack",
    subtitle: "Clause-by-clause evidence for certification audit",
    reportLabel: "ISO evidence",
    tenant: {
      name: String(tenant?.name ?? "Organisation"),
      orgNumber: (tenant?.companyNumber as string | null) ?? (tenant?.orgNumber as string | null),
      address: tenant?.address as string | null,
    },
    generatedBy: session.user.name ?? session.user.email ?? undefined,
    legalReference: "ISO 45001:2018; ISO 9001:2015 — not an HSE submission",
    sections,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="iso-45001-9001-evidence.pdf"',
    },
  });
}
