import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { ArticleGrid } from "@/features/news/components/article-grid";
import { NewsHero } from "@/features/news/components/news-hero";
import { pageHref } from "@/features/news/components/news-pagination";
import { NEWS_BASE_PATH, categoryPath, parsePageParam } from "@/lib/news/news-content";
import { getCategoryBySlug, listCategories, listPublishedArticles } from "@/lib/news/news-queries";
import {
  getBreadcrumbSchema,
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const loadCategory = cache(getCategoryBySlug);

function categoryDescription(name: string, description: string | null): string {
  return (
    description ??
    `${name} articles from HSEQ Nova: practical guidance for UK employers, with links to the law and HSE guidance.`
  );
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page: rawPage }] = await Promise.all([params, searchParams]);
  const category = await loadCategory(slug);
  if (!category) {
    return { title: `Category not found | ${SITE_CONFIG.name}`, robots: { index: false, follow: true } };
  }

  const page = parsePageParam(rawPage) ?? 1;
  const baseTitle = `${category.name} – News and guidance`;
  const title = page > 1 ? `${baseTitle} – page ${page} | ${SITE_CONFIG.name}` : `${baseTitle} | ${SITE_CONFIG.name}`;
  const description = categoryDescription(category.name, category.description);
  const path = pageHref(categoryPath(category.slug), page);

  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path) },
    robots: ROBOTS_CONFIG,
    openGraph: getOpenGraphDefaults(title, description, path),
    twitter: getTwitterDefaults(title, description),
  };
}

export default async function NewsCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page: rawPage }] = await Promise.all([params, searchParams]);
  const page = parsePageParam(rawPage);
  const category = await loadCategory(slug);
  if (!category || page === null) {
    notFound();
  }

  const [result, categories] = await Promise.all([
    listPublishedArticles({ page, categoryId: category.id }),
    listCategories(),
  ]);
  if (page > result.pageCount) {
    notFound();
  }

  const path = categoryPath(category.slug);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.name} – News and guidance`,
      description: categoryDescription(category.name, category.description),
      url: getCanonicalUrl(path),
      inLanguage: "en-GB",
    },
    getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "News", url: NEWS_BASE_PATH },
      { name: category.name, url: path },
    ]),
  ];

  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={jsonLd} />
      <NewsHero
        eyebrow="News and guidance"
        title={category.name}
        description={categoryDescription(category.name, category.description)}
        categories={categories}
        activeCategorySlug={category.slug}
      />
      <section className="container mx-auto px-4 py-14 lg:py-20">
        <ArticleGrid
          articles={result.items}
          basePath={path}
          page={result.page}
          pageCount={result.pageCount}
          featureFirst={false}
        />
      </section>
    </div>
  );
}
