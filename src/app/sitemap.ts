import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo-config";
import { articlePath, categoryPath, NEWS_BASE_PATH } from "@/lib/news/news-content";
import { listAllPublishedForFeeds, listCategories } from "@/lib/news/news-queries";
import type { NewsArticleSummary, NewsCategory } from "@/lib/news/news-types";

// Built per request so newly published articles appear without a redeploy.
export const dynamic = "force-dynamic";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: ChangeFrequency }> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/register", priority: 0.9, changeFrequency: "monthly" },
  { path: "/book-a-demo", priority: 0.9, changeFrequency: "weekly" },
  { path: "/digital-safety-board", priority: 0.9, changeFrequency: "weekly" },
  { path: "/health-safety-software", priority: 0.8, changeFrequency: "monthly" },
  { path: "/health-and-safety-policy", priority: 0.8, changeFrequency: "monthly" },
  { path: "/riddor", priority: 0.8, changeFrequency: "monthly" },
  { path: "/rams", priority: 0.8, changeFrequency: "monthly" },
  { path: "/coshh", priority: 0.8, changeFrequency: "monthly" },
  { path: NEWS_BASE_PATH, priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/team", priority: 0.4, changeFrequency: "yearly" },
  { path: "/personvern", priority: 0.3, changeFrequency: "yearly" },
  { path: "/vilkar", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
];

async function loadNewsEntries(): Promise<{ articles: NewsArticleSummary[]; categories: NewsCategory[] }> {
  try {
    const [articles, categories] = await Promise.all([listAllPublishedForFeeds(), listCategories()]);
    return { articles, categories };
  } catch {
    // The static sitemap must still be served if the database is unreachable.
    return { articles: [], categories: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  const { articles, categories } = await loadNewsEntries();
  const latestArticle = articles[0]?.updatedAt;

  const staticEntries = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: path === NEWS_BASE_PATH && latestArticle ? new Date(latestArticle) : undefined,
    changeFrequency,
    priority,
  }));

  const usedCategoryIds = new Set(articles.map((article) => article.category?.id).filter(Boolean));
  const categoryEntries = categories
    .filter((category) => usedCategoryIds.has(category.id))
    .map((category) => ({
      url: `${baseUrl}${categoryPath(category.slug)}`,
      lastModified: new Date(
        articles.find((article) => article.category?.id === category.id)?.updatedAt ?? Date.now()
      ),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}${articlePath(article.slug)}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    ...(article.coverImage
      ? {
          images: [
            article.coverImage.startsWith("http") ? article.coverImage : `${baseUrl}${article.coverImage}`,
          ],
        }
      : {}),
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries];
}
