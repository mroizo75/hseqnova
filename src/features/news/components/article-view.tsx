import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleBody } from "@/features/news/components/article-body";
import { ArticleCard, isExternalImage } from "@/features/news/components/article-card";
import {
  NEWS_BASE_PATH,
  categoryPath,
  estimateReadingMinutes,
  formatArticleDate,
} from "@/lib/news/news-content";
import type { NewsArticle, NewsArticleSummary } from "@/lib/news/news-types";

type ArticleViewProps = {
  article: NewsArticle;
  related: NewsArticleSummary[];
};

function isSameDay(a: string, b: string): boolean {
  return formatArticleDate(a) === formatArticleDate(b);
}

export function ArticleView({ article, related }: ArticleViewProps) {
  const readingMinutes = estimateReadingMinutes(article.content);
  const published = article.publishedAt;
  const showUpdated = published !== null && !isSameDay(published, article.updatedAt);

  return (
    <article className="home-marketing font-marketing">
      <header className="bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
        <div className="container mx-auto max-w-4xl px-4 pb-14 pt-10 lg:pb-20">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-white/65">
              <li>
                <Link href="/" className="hover:text-white">Home</Link>
              </li>
              <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
              <li>
                <Link href={NEWS_BASE_PATH} className="hover:text-white">News</Link>
              </li>
              {article.category ? (
                <>
                  <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                  <li>
                    <Link href={categoryPath(article.category.slug)} className="hover:text-white">
                      {article.category.name}
                    </Link>
                  </li>
                </>
              ) : null}
            </ol>
          </nav>

          <h1 className="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl lg:leading-[1.1]">
            {article.title}
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-white/80">{article.excerpt}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
            {article.authorName ? <span>By {article.authorName}</span> : null}
            {published ? (
              <time dateTime={published}>{formatArticleDate(published)}</time>
            ) : (
              <span>Not published</span>
            )}
            {showUpdated ? (
              <span>
                Updated <time dateTime={article.updatedAt}>{formatArticleDate(article.updatedAt)}</time>
              </span>
            ) : null}
            <span>{readingMinutes} min read</span>
          </div>
        </div>
      </header>

      {article.coverImage ? (
        <div className="container mx-auto -mt-2 max-w-5xl px-4 pt-10">
          <figure>
            <Image
              src={article.coverImage}
              alt={article.coverImageAlt ?? ""}
              width={1600}
              height={900}
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="aspect-[16/9] w-full rounded-sm object-cover shadow-xl"
              priority
              unoptimized={isExternalImage(article.coverImage)}
            />
          </figure>
        </div>
      ) : null}

      <div className="container mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <ArticleBody html={article.content} />

        <aside className="mt-16 rounded-sm border border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ticket))] p-8">
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Keep your records in one place
          </h2>
          <p className="mt-3 text-[hsl(var(--home-ink)/0.75)]">
            HSEQ Nova gives UK employers a digital accident book, RIDDOR deadlines, a living H&amp;S
            policy, RAMS and COSHH — priced per company with unlimited users.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12">
              <Link href="/book-a-demo">
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 bg-transparent text-foreground">
              <Link href="/health-safety-software">See the features</Link>
            </Button>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="border-t border-[hsl(var(--home-rule))]">
          <div className="container mx-auto px-4 py-14 lg:py-20">
            <h2 className="mb-8 font-display text-3xl font-medium tracking-tight">Related articles</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} headingLevel="h3" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
