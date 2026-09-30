import { NextResponse } from "next/server";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { listAdminArticles } from "@/server/queries/news-admin.queries";

/**
 * GET /api/admin/blog
 * News articles for the admin newsletter picker.
 */
export async function GET() {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    return NextResponse.json({ code: "UNAUTHORISED", message: "Unauthorised" }, { status: 401 });
  }

  try {
    const articles = await listAdminArticles();
    return NextResponse.json(
      articles.map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        status: article.status,
        publishedAt: article.publishedAt,
        coverImage: article.coverImage,
      }))
    );
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Could not load articles";
    return NextResponse.json({ code: "NEWS_LIST_FAILED", message }, { status: 500 });
  }
}
