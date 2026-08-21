import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPermissions } from "@/lib/permissions";
import { addMonths } from "date-fns";

/**
 * POST /api/management-reviews/[id]/approve
 * Godkjenn ledelsens gjennomgang og oppdater alle tilknyttede dokumenter
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = getPermissions(session.user.role);
    if (!permissions.canCreateManagementReviews) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Hent gjennomgangen
    const review = await prisma.managementReview.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Management review not found" },
        { status: 404 }
      );
    }

    if (review.status === "APPROVED") {
      return NextResponse.json(
        { error: "Already approved" },
        { status: 400 }
      );
    }

    const now = new Date();
    const reviewDate = new Date(review.reviewDate);

    // Finn alle dokumenter som skulle vært gjennomgått innen denne datoen
    const documentsToReview = await prisma.document.findMany({
      where: {
        tenantId: session.user.tenantId,
        nextReviewDate: {
          lte: reviewDate,
        },
      },
    });

    // Oppdater hvert dokument
    const documentUpdates = documentsToReview.map((doc) => {
      const nextReviewDate = addMonths(now, doc.reviewIntervalMonths);
      
      return prisma.document.update({
        where: { id: doc.id },
        data: {
          status: "APPROVED",
          approvedBy: session.user.id,
          approvedAt: now,
          nextReviewDate,
        },
      });
    });

    // Oppdater gjennomgangen
    const reviewUpdate = prisma.managementReview.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: now,
      },
    });

    // Kjør alle oppdateringer i en transaksjon
    await prisma.$transaction([reviewUpdate, ...documentUpdates]);

    return NextResponse.json({
      success: true,
      message: `Ledelsens gjennomgang godkjent. ${documentsToReview.length} dokumenter oppdatert.`,
      documentsUpdated: documentsToReview.length,
    });
  } catch (error: any) {
    console.error("[MANAGEMENT_REVIEW_APPROVE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
