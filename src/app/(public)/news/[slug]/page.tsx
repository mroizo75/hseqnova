import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { ArticleView } from "@/features/news/components/article-view";
import {
  absoluteUrl,
  articlePath,
  articleSeoDescription,
  articleSeoTitle,
  buildArticleJsonLd,
} from "@/lib/news/news-content";
import { getPublishedArticleBySlug, listRelatedArticles } from "@/lib/news/news-queries";
import { getAdminDb } from "@/lib/supabase/admin";
import { getCanonicalUrl, ROBOTS_CONFIG, SITE_CONFIG } from "@/lib/seo-config";

type Props = {
  params: Promise<{ slug: string }>;
};

const loadArticle = cache(getPublishedArticleBySlug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) {
    return { title: `Article not found | ${SITE_CONFIG.name}`, robots: { index: false, follow: true } };
  }

  const title = articleSeoTitle(article);
  const description = articleSeoDescription(article);
  const url = getCanonicalUrl(articlePath(article.slug));
  const images = article.coverImage
    ? [{ url: absoluteUrl(article.coverImage), alt: article.coverImageAlt ?? article.title }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: ROBOTS_CONFIG,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
      authors: article.authorName ? [article.authorName] : undefined,
      section: article.category?.name,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@hseqnova",
      ...(images ? { images: images.map((image) => image.url) } : {}),
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) {
    notFound();
  }

  const related = await listRelatedArticles(article);

  after(async () => {
    await getAdminDb()
      .from("BlogPost")
      .update({ viewCount: article.viewCount + 1 })
      .eq("id", article.id);
  });

  return (
    <>
      <MultipleStructuredData dataArray={buildArticleJsonLd(article)} />
      <ArticleView article={article} related={related} />
    </>
  );
}
