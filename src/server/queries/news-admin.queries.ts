import { getAdminDb } from "@/lib/supabase/admin";
import {
  ARTICLE_COLUMNS,
  CATEGORY_COLUMNS,
  mapArticleRow,
  mapCategoryRow,
} from "@/lib/news/news-mappers";
import type { ArticleStatus, NewsArticle, NewsCategory } from "@/lib/news/news-types";

export type AdminCategory = NewsCategory & { articleCount: number };

type AdminListFilter = {
  status?: ArticleStatus;
  search?: string;
};

export async function listAdminArticles(filter: AdminListFilter = {}): Promise<NewsArticle[]> {
  let query = getAdminDb().from("BlogPost").select(ARTICLE_COLUMNS);
  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  const search = filter.search?.trim().replace(/[%,()]/g, " ");
  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  const { data, error } = await query.order("updatedAt", { ascending: false }).limit(500);
  if (error) {
    throw { code: "NEWS_ADMIN_LIST_FAILED", message: error.message };
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(mapArticleRow);
}

export async function getAdminArticle(id: string): Promise<NewsArticle | null> {
  const { data, error } = await getAdminDb()
    .from("BlogPost")
    .select(ARTICLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw { code: "NEWS_ADMIN_ARTICLE_FAILED", message: error.message };
  }
  return data ? mapArticleRow(data as unknown as Record<string, unknown>) : null;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const db = getAdminDb();
  const [{ data: categories, error }, { data: posts, error: postsError }] = await Promise.all([
    db.from("BlogCategory").select(CATEGORY_COLUMNS).order("name", { ascending: true }),
    db.from("BlogPost").select("categoryId").not("categoryId", "is", null),
  ]);
  if (error || postsError) {
    throw {
      code: "NEWS_ADMIN_CATEGORIES_FAILED",
      message: (error ?? postsError)?.message ?? "Could not load categories",
    };
  }

  const counts = new Map<string, number>();
  for (const post of posts ?? []) {
    const key = String(post.categoryId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (categories ?? [])
    .map((row) => mapCategoryRow(row))
    .filter((category): category is NewsCategory => category !== null)
    .map((category) => ({ ...category, articleCount: counts.get(category.id) ?? 0 }));
}
