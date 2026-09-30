import Image from "next/image";
import Link from "next/link";
import { articlePath, categoryPath, formatArticleDate } from "@/lib/news/news-content";
import type { NewsArticleSummary } from "@/lib/news/news-types";
import { cn } from "@/lib/utils";

type ArticleCardProps = {
  article: NewsArticleSummary;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
};

export function isExternalImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

export function ArticleCard({ article, featured = false, headingLevel = "h2" }: ArticleCardProps) {
  const Heading = headingLevel;
  const href = articlePath(article.slug);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-sm border border-[hsl(var(--home-rule))] bg-white transition-shadow hover:shadow-lg",
        featured && "lg:grid lg:grid-cols-[1.2fr_1fr]"
      )}
    >
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-[hsl(var(--home-ticket))]" tabIndex={-1} aria-hidden>
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt=""
            fill
            sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={featured}
            unoptimized={isExternalImage(article.coverImage)}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl text-[hsl(var(--home-ink)/0.35)]">
            HSEQ Nova
          </div>
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col p-6", featured && "lg:justify-center lg:p-10")}>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em]">
          {article.category ? (
            <Link
              href={categoryPath(article.category.slug)}
              className="text-emerald-800 hover:text-emerald-950"
            >
              {article.category.name}
            </Link>
          ) : null}
          {article.publishedAt ? (
            <time dateTime={article.publishedAt} className="text-[hsl(var(--home-ink)/0.55)]">
              {formatArticleDate(article.publishedAt)}
            </time>
          ) : null}
        </div>

        <Heading
          className={cn(
            "font-display font-medium tracking-tight text-balance",
            featured ? "text-3xl md:text-4xl" : "text-xl"
          )}
        >
          <Link href={href} className="hover:underline decoration-emerald-700 underline-offset-4">
            {article.title}
          </Link>
        </Heading>

        <p
          className={cn(
            "mt-3 text-[hsl(var(--home-ink)/0.72)] leading-relaxed",
            featured ? "text-lg" : "line-clamp-3 text-sm"
          )}
        >
          {article.excerpt}
        </p>
      </div>
    </article>
  );
}
