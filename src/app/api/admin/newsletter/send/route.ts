import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/admin/newsletter/send
 * Blog newsletter is not offered in the UK product.
 */
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Blog newsletter is not available in the UK product" },
    { status: 410 }
  );
}

/**
 * GET /api/admin/newsletter/send
 * Newsletter subscriber stats
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalSubscribers = await db.generatedDocument.count({
      where: {
        newsletterSubscribed: true,
      },
    });

    const recentlySent = await db.generatedDocument.findMany({
      where: {
        newsletterSubscribed: true,
        lastNewsletterSent: {
          not: null,
        },
      },
      orderBy: {
        lastNewsletterSent: "desc",
      },
      take: 1,
      select: {
        lastNewsletterSent: true,
      },
    });

    return NextResponse.json({
      totalSubscribers,
      lastSentAt: recentlySent[0]?.lastNewsletterSent || null,
    });
  } catch (error) {
    console.error("Error fetching newsletter stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
