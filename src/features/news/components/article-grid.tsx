import Link from "next/link";
import { ArticleCard } from "@/features/news/components/article-card";
import { NewsPagination } from "@/features/news/components/news-pagination";
import type { NewsArticleSummary } from "@/lib/news/news-types";

type ArticleGridProps = {
  articles: NewsArticleSummary[];
  basePath: string;
  page: number;
  pageCount: number;
  featureFirst: boolean;
};

export function ArticleGrid({ articles, basePath, page, pageCount, featureFirst }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-[hsl(var(--home-rule))] bg-white px-6 py-16 text-center">
        <h2 className="font-display text-2xl font-medium">No articles yet</h2>
        <p className="mx-auto mt-3 max-w-md text-[hsl(var(--home-ink)/0.7)]">
          We are writing practical guidance on RIDDOR, COSHH, RAMS and CDM 2015. In the meantime,
          see how HSEQ Nova handles{" "}
          <Link href="/riddor" className="text-emerald-800 underline underline-offset-4">
            the accident book and RIDDOR
          </Link>
          .
        </p>
      </div>
    );
  }

  const [first, ...rest] = articles;
  const featured = featureFirst ? first : null;
  const gridItems = featureFirst ? rest : articles;

  return (
    <>
      {featured ? (
        <div className="mb-10">
          <ArticleCard article={featured} featured />
        </div>
      ) : null}
      {gridItems.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : null}
      <NewsPagination basePath={basePath} page={page} pageCount={pageCount} />
    </>
  );
}
