import { getPublicDb } from "@/lib/supabase/public";
import { NEWS_PAGE_SIZE } from "@/lib/news/news-content";
import {
  ARTICLE_COLUMNS,
  CATEGORY_COLUMNS,
  SUMMARY_COLUMNS,
  mapArticleRow,
  mapCategoryRow,
  mapSummaryRow,
} from "@/lib/news/news-mappers";
import type {
  NewsArticle,
  NewsArticleSummary,
  NewsCategory,
  NewsPage,
} from "@/lib/news/news-types";

type ListOptions = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
};

function publishedQuery(columns: string, count?: "exact") {
  // RLS already restricts anon to published rows; the explicit filter keeps intent readable.
  return getPublicDb()
    .from("BlogPost")
    .select(columns, count ? { count } : undefined)
    .eq("status", "PUBLISHED")
    .lte("publishedAt", new Date().toISOString());
}

function throwDbError(error: { message: string } | null, code: string): void {
  if (error) {
    throw { code, message: error.message };
  }
}

export async function listPublishedArticles(options: ListOptions = {}): Promise<NewsPage<NewsArticleSummary>> {
  const pageSize = options.pageSize ?? NEWS_PAGE_SIZE;
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const from = (page - 1) * pageSize;

  let query = publishedQuery(SUMMARY_COLUMNS, "exact");
  if (options.categoryId) {
    query = query.eq("categoryId", options.categoryId);
  }

  const { data, error, count } = await query
    .order("publishedAt", { ascending: false })
    .range(from, from + pageSize - 1);
  throwDbError(error, "NEWS_LIST_FAILED");

  const total = count ?? 0;
  return {
    items: ((data ?? []) as unknown as Record<string, unknown>[]).map(mapSummaryRow),
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total,
  };
}

export async function getPublishedArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const { data, error } = await publishedQuery(ARTICLE_COLUMNS).eq("slug", slug).maybeSingle();
  throwDbError(error, "NEWS_ARTICLE_FAILED");
  return data ? mapArticleRow(data as unknown as Record<string, unknown>) : null;
}

export async function listRelatedArticles(article: NewsArticle, limit = 3): Promise<NewsArticleSummary[]> {
  let query = publishedQuery(SUMMARY_COLUMNS).neq("id", article.id);
  if (article.category) {
    query = query.eq("categoryId", article.category.id);
  }
  const { data, error } = await query.order("publishedAt", { ascending: false }).limit(limit);
  throwDbError(error, "NEWS_RELATED_FAILED");
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapSummaryRow);
}

export async function listAllPublishedForFeeds(): Promise<NewsArticleSummary[]> {
  const { data, error } = await publishedQuery(SUMMARY_COLUMNS)
    .order("publishedAt", { ascending: false })
    .limit(5000);
  throwDbError(error, "NEWS_FEED_FAILED");
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapSummaryRow);
}

export async function listCategories(): Promise<NewsCategory[]> {
  const { data, error } = await getPublicDb()
    .from("BlogCategory")
    .select(CATEGORY_COLUMNS)
    .order("name", { ascending: true });
  throwDbError(error, "NEWS_CATEGORIES_FAILED");
  return (data ?? [])
    .map((row) => mapCategoryRow(row))
    .filter((category): category is NewsCategory => category !== null);
}

export async function getCategoryBySlug(slug: string): Promise<NewsCategory | null> {
  const { data, error } = await getPublicDb()
    .from("BlogCategory")
    .select(CATEGORY_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  throwDbError(error, "NEWS_CATEGORY_FAILED");
  return mapCategoryRow(data);
}
