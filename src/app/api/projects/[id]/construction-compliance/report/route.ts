import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  buildConstructionComplianceValidation,
  evaluatePreNotificationRequirement,
} from "@/lib/construction-compliance-rules";
import { generateConstructionCompliancePdf } from "@/lib/construction-compliance-pdf";
import { loadProjectSummary } from "@/server/queries/projects.queries";
import {
  loadPreNotification,
  loadRosterChecks,
  loadRosterEntries,
  loadShaPlan,
  loadTenantOrg,
} from "@/server/queries/construction-compliance.queries";

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.tenantId) {
      return new NextResponse("Unauthorised", { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const [project, tenant, shaPlan, preNotification, rosterEntries, rosterChecks] = await Promise.all([
      loadProjectSummary(id, tenantId),
      loadTenantOrg(tenantId),
      loadShaPlan(id),
      loadPreNotification(id),
      loadRosterEntries(id, tenantId),
      loadRosterChecks(id, tenantId),
    ]);

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const latestCheck = rosterChecks[0];
    const todayKey = formatDateOnly(new Date());
    const latestCheckKey = latestCheck ? formatDateOnly(new Date(latestCheck.checkedDate)) : null;
    const hasActiveWorkers = rosterEntries.some((entry) => entry.isActive);
    const isDailyCheckMissing = hasActiveWorkers && latestCheckKey !== todayKey;
    const preNotificationRequirement = evaluatePreNotificationRequirement(preNotification);
    const complianceValidation = buildConstructionComplianceValidation(shaPlan, preNotification);

    const pdfBuffer = await generateConstructionCompliancePdf({
      tenantName: tenant?.name ?? "HSEQ Nova",
      project,
      shaPlan,
      preNotification,
      rosterEntries,
      rosterChecks,
      isDailyCheckMissing,
      preNotificationRequirement,
      complianceValidation,
    });

    const safeProjectName = project.name
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    const filename = `CDM-2015-${safeProjectName}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
