import { SITE_CONFIG } from "@/lib/seo-config";
import type { NewsArticle } from "@/lib/news/news-types";

export const NEWS_PAGE_SIZE = 12;
export const NEWS_BASE_PATH = "/news";

const WORDS_PER_MINUTE = 230;

/** BlogPost columns are `timestamp without time zone` holding UTC; PostgREST omits the offset. */
export function normalizeDbTimestamp(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(hasZone ? iso : `${iso}Z`).toISOString();
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadingMinutes(html: string): number {
  const text = htmlToPlainText(html);
  if (!text) {
    return 1;
  }
  const words = text.split(" ").length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Returns the requested page, or null when the query value is not a positive integer. */
export function parsePageParam(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === "") {
    return 1;
  }
  if (!/^\d{1,4}$/.test(raw)) {
    return null;
  }
  const page = Number(raw);
  return page >= 1 ? page : null;
}

export function articlePath(slug: string): string {
  return `${NEWS_BASE_PATH}/${slug}`;
}

export function categoryPath(slug: string): string {
  return `${NEWS_BASE_PATH}/category/${slug}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return `${SITE_CONFIG.url}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function formatArticleDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

export function articleSeoTitle(article: Pick<NewsArticle, "title" | "metaTitle">): string {
  const base = article.metaTitle?.trim() || article.title;
  const suffix = ` | ${SITE_CONFIG.name}`;
  return base.includes(SITE_CONFIG.name) ? base : `${base}${suffix}`;
}

export function articleSeoDescription(
  article: Pick<NewsArticle, "excerpt" | "metaDescription">
): string {
  return article.metaDescription?.trim() || article.excerpt;
}

type ArticleJsonLdInput = Pick<
  NewsArticle,
  | "title"
  | "slug"
  | "excerpt"
  | "metaDescription"
  | "coverImage"
  | "publishedAt"
  | "updatedAt"
  | "authorName"
  | "category"
>;

export function buildArticleJsonLd(article: ArticleJsonLdInput): Array<Record<string, unknown>> {
  const url = absoluteUrl(articlePath(article.slug));
  const publisher = {
    "@type": "Organization",
    "@id": `${SITE_CONFIG.url}/#organisation`,
    name: SITE_CONFIG.name,
    logo: { "@type": "ImageObject", url: `${SITE_CONFIG.url}/opengraph-image` },
  };

  const newsArticle: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title.slice(0, 110),
    description: articleSeoDescription(article),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "en-GB",
    datePublished: article.publishedAt ?? article.updatedAt,
    dateModified: article.updatedAt,
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@type": "Organization", name: SITE_CONFIG.name, url: SITE_CONFIG.url },
    publisher,
    ...(article.coverImage ? { image: [absoluteUrl(article.coverImage)] } : {}),
    ...(article.category ? { articleSection: article.category.name } : {}),
  };

  const crumbs = [
    { name: "Home", item: SITE_CONFIG.url },
    { name: "News", item: absoluteUrl(NEWS_BASE_PATH) },
    ...(article.category
      ? [{ name: article.category.name, item: absoluteUrl(categoryPath(article.category.slug)) }]
      : []),
    { name: article.title, item: url },
  ];

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };

  return [newsArticle, breadcrumb];
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
