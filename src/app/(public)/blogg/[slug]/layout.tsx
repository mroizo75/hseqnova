import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { SITE_CONFIG, ROBOTS_CONFIG } from "@/lib/seo-config";

interface BlogSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = SITE_CONFIG.url;

  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: {
        title: true,
        excerpt: true,
        content: true,
        coverImage: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        publishedAt: true,
        updatedAt: true,
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    });

    if (!post) {
      return { title: "Artikkel ikke funnet | HMS Nova" };
    }

    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt;
    const url = `${baseUrl}/blogg/${slug}`;
    const wordCount = post.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(post.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    let freshness = "older";
    if (daysSinceUpdate < 7) freshness = "very-fresh";
    else if (daysSinceUpdate < 30) freshness = "fresh";
    else if (daysSinceUpdate < 90) freshness = "recent";

    return {
      title,
      description,
      keywords: post.keywords || undefined,
      authors: post.author.name ? [{ name: post.author.name }] : undefined,
      alternates: {
        canonical: url,
      },
      robots: ROBOTS_CONFIG,
      openGraph: {
        title,
        description,
        type: "article",
        url,
        publishedTime: post.publishedAt?.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: post.author.name ? [post.author.name] : undefined,
        images: post.coverImage
          ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
          : undefined,
        siteName: SITE_CONFIG.name,
        locale: SITE_CONFIG.locale,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: post.coverImage ? [post.coverImage] : undefined,
        creator: "@hmsnova",
      },
      other: {
        "article:published_time": post.publishedAt?.toISOString() || "",
        "article:modified_time": post.updatedAt.toISOString(),
        "article:author": post.author.name || "HMS Nova",
        "article:section": post.category?.name || "HMS",
        "article:tag": post.keywords || "",
        "citation_title": post.title,
        "citation_author": post.author.name || "HMS Nova Team",
        "citation_publication_date": post.publishedAt?.toISOString().split("T")[0] || "",
        "citation_journal_title": "HMS Nova Blogg",
        "last-modified": post.updatedAt.toISOString(),
        "content-freshness": freshness,
        "content-type": "article",
        "word-count": wordCount.toString(),
        "reading-time": `${readingTime} minutes`,
        "content-language": "nb",
      },
    };
  } catch {
    return { title: "Blogg | HMS Nova" };
  }
}

export default async function BlogSlugLayout({ children }: BlogSlugLayoutProps) {
  return children;
}
