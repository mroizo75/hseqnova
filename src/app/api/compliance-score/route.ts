import { NextResponse } from "next/server";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { calculateComplianceScore } from "@/lib/compliance-score";

/**
 * GET /api/compliance-score
 *
 * Returns the compliance score breakdown for the authenticated tenant.
 */
export async function GET() {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const score = await calculateComplianceScore(tenantId);
    return NextResponse.json(score);
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to calculate compliance score" },
      { status: 500 },
    );
  }
}
