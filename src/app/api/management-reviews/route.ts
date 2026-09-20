import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { resolveScopedTenantId } from "@/lib/external-competent-person";
import { createMeasuresFromReviewPlan } from "@/server/queries/iso.queries";

export const dynamic = "force-dynamic";

const createManagementReviewSchema = z.object({
  title: z.string().min(1),
  reviewDate: z.string().datetime(),
  period: z.string().min(1),
  conductedBy: z.string().min(1),
  participants: z.array(z.string()).optional(),
  hmsGoalsReview: z.string().optional(),
  incidentStatistics: z.string().optional(),
  riskReview: z.string().optional(),
  auditResults: z.string().optional(),
  trainingStatus: z.string().optional(),
  resourcesReview: z.string().optional(),
  externalChanges: z.string().optional(),
  previousActionsStatus: z.string().optional(),
  interestedPartiesReview: z.string().optional(),
  complianceEvaluationReview: z.string().optional(),
  consultationReview: z.string().optional(),
  communicationReview: z.string().optional(),
  wellbeingSummary: z.string().optional(),
  conclusions: z.string().optional(),
  decisions: z.array(z.any()).optional(),
  actionPlan: z.array(z.any()).optional(),
  nextReviewDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// GET /api/management-reviews - List all reviews for tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await db.managementReview.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { reviewDate: "desc" },
    });

    return NextResponse.json({ data: reviews });
  } catch (error: any) {
    console.error("[MANAGEMENT_REVIEWS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/management-reviews - Create new review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createManagementReviewSchema.parse(body);
    const tenantId = resolveScopedTenantId(session.user.tenantId, body.tenantId);

    const review = await db.managementReview.create({
      data: {
        ...validatedData,
        tenantId,
        participants: validatedData.participants
          ? JSON.stringify(validatedData.participants)
          : null,
        decisions: validatedData.decisions
          ? JSON.stringify(validatedData.decisions)
          : null,
        actionPlan: validatedData.actionPlan
          ? JSON.stringify(validatedData.actionPlan)
          : null,
        nextReviewDate: validatedData.nextReviewDate
          ? new Date(validatedData.nextReviewDate)
          : null,
      },
    });

    if (validatedData.actionPlan) {
      await createMeasuresFromReviewPlan(tenantId, validatedData.actionPlan);
    }

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error: any) {
    console.error("[MANAGEMENT_REVIEWS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

