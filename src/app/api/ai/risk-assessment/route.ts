import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredTenantContext } from "@/lib/tenant-context";
import { AiAddonNotEnabledError } from "@/lib/ai-gate";
import { generateRiskAssessment } from "@/lib/ai-hseq";

const bodySchema = z.object({
  activity: z.string().min(1).max(1000),
  location: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  existingRisks: z.array(z.string()).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ctx = await getRequiredTenantContext();
    const body = bodySchema.parse(await request.json());

    const result = await generateRiskAssessment(ctx.tenantId, body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof AiAddonNotEnabledError) {
      return NextResponse.json(
        { error: "AI Pro add-on is not enabled for this organisation." },
        { status: 403 },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body.", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
