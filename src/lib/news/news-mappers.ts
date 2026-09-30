import { normalizeDbTimestamp } from "@/lib/news/news-content";
import {
  ARTICLE_STATUSES,
  type ArticleStatus,
  type NewsArticle,
  type NewsArticleSummary,
  type NewsCategory,
} from "@/lib/news/news-types";

export const CATEGORY_COLUMNS = "id, name, slug, description";

export const SUMMARY_COLUMNS = `id, title, slug, excerpt, coverImage, coverImageAlt, publishedAt, updatedAt, authorName, category:BlogCategory(${CATEGORY_COLUMNS})`;

export const ARTICLE_COLUMNS = `${SUMMARY_COLUMNS}, content, metaTitle, metaDescription, status, viewCount`;

type Row = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function mapCategoryRow(row: unknown): NewsCategory | null {
  const value = Array.isArray(row) ? row[0] : row;
  if (!value || typeof value !== "object") {
    return null;
  }
  const r = value as Row;
  return {
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    description: toStringOrNull(r.description),
  };
}

export function mapSummaryRow(row: Row): NewsArticleSummary {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt ?? ""),
    coverImage: toStringOrNull(row.coverImage),
    coverImageAlt: toStringOrNull(row.coverImageAlt),
    publishedAt: normalizeDbTimestamp(toStringOrNull(row.publishedAt)),
    updatedAt: normalizeDbTimestamp(toStringOrNull(row.updatedAt)) ?? new Date(0).toISOString(),
    authorName: toStringOrNull(row.authorName),
    category: mapCategoryRow(row.category),
  };
}

function toStatus(value: unknown): ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus) ? (value as ArticleStatus) : "DRAFT";
}

export function mapArticleRow(row: Row): NewsArticle {
  return {
    ...mapSummaryRow(row),
    content: String(row.content ?? ""),
    metaTitle: toStringOrNull(row.metaTitle),
    metaDescription: toStringOrNull(row.metaDescription),
    status: toStatus(row.status),
    viewCount: Number(row.viewCount ?? 0),
  };
}
