import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { ArticleGrid } from "@/features/news/components/article-grid";
import { NewsHero } from "@/features/news/components/news-hero";
import { pageHref } from "@/features/news/components/news-pagination";
import { NEWS_BASE_PATH, absoluteUrl, parsePageParam } from "@/lib/news/news-content";
import { listCategories, listPublishedArticles } from "@/lib/news/news-queries";
import {
  getBreadcrumbSchema,
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

const PAGE_TITLE = "Health and Safety News and Guidance | HSEQ Nova";
const PAGE_DESCRIPTION =
  "Practical UK health and safety guidance: RIDDOR reporting, the accident book, COSHH, RAMS, CDM 2015 and HSEQ Nova product updates.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parsePageParam((await searchParams).page) ?? 1;
  const title = page > 1 ? `News – page ${page} | ${SITE_CONFIG.name}` : PAGE_TITLE;
  const path = pageHref(NEWS_BASE_PATH, page);

  return {
    title,
    description: PAGE_DESCRIPTION,
    alternates: {
      canonical: getCanonicalUrl(path),
      types: { "application/rss+xml": absoluteUrl(`${NEWS_BASE_PATH}/rss.xml`) },
    },
    robots: ROBOTS_CONFIG,
    openGraph: getOpenGraphDefaults(title, PAGE_DESCRIPTION, path),
    twitter: getTwitterDefaults(title, PAGE_DESCRIPTION),
  };
}

export default async function NewsIndexPage({ searchParams }: Props) {
  const page = parsePageParam((await searchParams).page);
  if (page === null) {
    notFound();
  }

  const [result, categories] = await Promise.all([
    listPublishedArticles({ page }),
    listCategories(),
  ]);
  if (page > result.pageCount) {
    notFound();
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: getCanonicalUrl(NEWS_BASE_PATH),
      inLanguage: "en-GB",
      isPartOf: { "@id": `${SITE_CONFIG.url}/#organisation` },
    },
    getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "News", url: NEWS_BASE_PATH },
    ]),
  ];

  return (
    <div className="home-marketing font-marketing">
      <MultipleStructuredData dataArray={jsonLd} />
      <NewsHero
        eyebrow="News and guidance"
        title="Health and safety, explained for UK employers"
        description="Plain-English guidance on the duties that matter — RIDDOR, COSHH, RAMS and CDM 2015 — with links to the law and HSE guidance behind every point."
        categories={categories}
      />
      <section className="container mx-auto px-4 py-14 lg:py-20">
        <ArticleGrid
          articles={result.items}
          basePath={NEWS_BASE_PATH}
          page={result.page}
          pageCount={result.pageCount}
          featureFirst={result.page === 1}
        />
      </section>
    </div>
  );
}
