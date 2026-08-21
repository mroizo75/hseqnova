import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email";
import BlogNewsletterEmail from "@/lib/email-templates/blog-newsletter";

/**
 * POST /api/admin/newsletter/send
 * Send newsletter to all subscribers with selected blog posts
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { postIds } = await req.json();

    if (!postIds || postIds.length === 0) {
      return NextResponse.json(
        { error: "No posts selected" },
        { status: 400 }
      );
    }

    // Get selected blog posts
    const posts = await db.blogPost.findMany({
      where: {
        id: {
          in: postIds,
        },
        status: "PUBLISHED",
      },
      select: {
        title: true,
        excerpt: true,
        slug: true,
        coverImage: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No published posts found" },
        { status: 404 }
      );
    }

    // Get all newsletter subscribers
    const subscribers = await db.generatedDocument.findMany({
      where: {
        newsletterSubscribed: true,
      },
      select: {
        email: true,
        ceoName: true,
        id: true,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers found" },
        { status: 404 }
      );
    }

    // Send emails to all subscribers
    let successCount = 0;
    let failCount = 0;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hmsnova.no";

    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?id=${subscriber.id}`;

        const emailHtml = await render(
          BlogNewsletterEmail({
            recipientName: subscriber.ceoName || "der",
            posts: posts.map((post) => ({
              title: post.title,
              excerpt: post.excerpt,
              slug: post.slug,
              coverImage: post.coverImage || "",
              publishedAt: post.publishedAt?.toISOString() || "",
            })),
            unsubscribeUrl,
          })
        );

        await sendEmail({
          to: subscriber.email,
          subject: `HMS Nova: ${posts[0]?.title}`,
          html: emailHtml,
        });

        // Update lastNewsletterSent
        await db.generatedDocument.update({
          where: { id: subscriber.id },
          data: {
            lastNewsletterSent: new Date(),
          },
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${successCount} subscribers`,
      successCount,
      failCount,
      totalSubscribers: subscribers.length,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/newsletter/send
 * Get newsletter stats
 */
export async function GET(req: NextRequest) {
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

