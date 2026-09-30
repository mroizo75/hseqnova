import { getAdminDb } from "@/lib/supabase/admin";
import {
  buildComparisonRanges,
  findStrikingDistance,
  toMetrics,
  urlToPath,
  type DateRange,
  type SearchAnalyticsRow,
  type SearchMetrics,
  type SeoRangeDays,
} from "@/lib/google/search-console-core";
import {
  getSearchConsoleProperty,
  listSitemaps,
  querySearchAnalytics,
  type SitemapStatus,
} from "@/lib/google/search-console";
import { NEWS_BASE_PATH } from "@/lib/news/news-content";

const CACHE_TTL_MS = 30 * 60 * 1000;

export type QueryPerformance = SearchMetrics & { query: string };
export type PagePerformance = SearchMetrics & { path: string; url: string };
export type ArticlePerformance = PagePerformance & { title: string | null; articleId: string | null };
export type TrendPoint = { date: string; clicks: number; impressions: number };

export type SeoDashboard = {
  property: string;
  range: DateRange;
  previousRange: DateRange;
  totals: { current: SearchMetrics; previous: SearchMetrics };
  trend: TrendPoint[];
  topQueries: QueryPerformance[];
  strikingDistance: QueryPerformance[];
  topPages: PagePerformance[];
  articles: ArticlePerformance[];
  sitemaps: SitemapStatus[];
  fetchedAt: string;
};

const cache = new Map<SeoRangeDays, { expiresAt: number; value: SeoDashboard }>();

export function clearSeoDashboardCache(): void {
  cache.clear();
}

function toQuery(row: SearchAnalyticsRow): QueryPerformance {
  return { query: row.keys?.[0] ?? "", ...toMetrics(row) };
}

function toPage(row: SearchAnalyticsRow): PagePerformance {
  const url = row.keys?.[0] ?? "";
  return { url, path: urlToPath(url), ...toMetrics(row) };
}

async function loadArticleIndex(): Promise<Map<string, { id: string; title: string }>> {
  const { data, error } = await getAdminDb().from("BlogPost").select("id, slug, title");
  if (error) {
    throw { code: "SEO_ARTICLES_FAILED", message: error.message };
  }
  return new Map(
    (data ?? []).map((row) => [`${NEWS_BASE_PATH}/${String(row.slug)}`, { id: String(row.id), title: String(row.title) }])
  );
}

async function loadDashboard(days: SeoRangeDays): Promise<SeoDashboard> {
  const { current, previous } = buildComparisonRanges(days, new Date());

  const [currentTotals, previousTotals, trendRows, queryRows, pageRows, newsRows, sitemaps, articleIndex] =
    await Promise.all([
      querySearchAnalytics({ ...current }),
      querySearchAnalytics({ ...previous }),
      querySearchAnalytics({ ...current, dimensions: ["date"] }),
      querySearchAnalytics({ ...current, dimensions: ["query"], rowLimit: 500 }),
      querySearchAnalytics({ ...current, dimensions: ["page"], rowLimit: 25 }),
      querySearchAnalytics({ ...current, dimensions: ["page"], rowLimit: 100, pageContains: `${NEWS_BASE_PATH}/` }),
      listSitemaps(),
      loadArticleIndex(),
    ]);

  return {
    property: getSearchConsoleProperty(),
    range: current,
    previousRange: previous,
    totals: { current: toMetrics(currentTotals[0]), previous: toMetrics(previousTotals[0]) },
    trend: trendRows.map((row) => ({ date: row.keys?.[0] ?? "", clicks: row.clicks, impressions: row.impressions })),
    topQueries: queryRows.slice(0, 25).map(toQuery),
    strikingDistance: findStrikingDistance(queryRows).map(toQuery),
    topPages: pageRows.map(toPage),
    articles: newsRows.map((row) => {
      const page = toPage(row);
      const article = articleIndex.get(page.path.split("?")[0]);
      return { ...page, title: article?.title ?? null, articleId: article?.id ?? null };
    }),
    sitemaps,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getSeoDashboard(days: SeoRangeDays): Promise<SeoDashboard> {
  const cached = cache.get(days);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const value = await loadDashboard(days);
  cache.set(days, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
