export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export type NewsCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type NewsArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  authorName: string | null;
  category: NewsCategory | null;
};

export type NewsArticle = NewsArticleSummary & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  status: ArticleStatus;
  viewCount: number;
};

export type NewsPage<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
};
