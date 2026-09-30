import Link from "next/link";
import { Rss } from "lucide-react";
import { NEWS_BASE_PATH, categoryPath } from "@/lib/news/news-content";
import type { NewsCategory } from "@/lib/news/news-types";
import { cn } from "@/lib/utils";

type NewsHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  categories: NewsCategory[];
  activeCategorySlug?: string;
};

export function NewsHero({ eyebrow, title, description, categories, activeCategorySlug }: NewsHeroProps) {
  const chipBase =
    "inline-flex min-h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors";

  return (
    <section className="bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
      <div className="container mx-auto px-4 py-14 lg:py-20">
        <p className="mb-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{description}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href={NEWS_BASE_PATH}
            className={cn(
              chipBase,
              !activeCategorySlug
                ? "border-emerald-300 bg-emerald-300 text-emerald-950"
                : "border-white/25 bg-transparent text-white/85 hover:bg-white/10 hover:text-white"
            )}
          >
            All articles
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={categoryPath(category.slug)}
              aria-current={activeCategorySlug === category.slug ? "page" : undefined}
              className={cn(
                chipBase,
                activeCategorySlug === category.slug
                  ? "border-emerald-300 bg-emerald-300 text-emerald-950"
                  : "border-white/25 bg-transparent text-white/85 hover:bg-white/10 hover:text-white"
              )}
            >
              {category.name}
            </Link>
          ))}
          <a
            href={`${NEWS_BASE_PATH}/rss.xml`}
            className="ml-auto inline-flex min-h-9 items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Rss className="h-4 w-4" aria-hidden />
            RSS
          </a>
        </div>
      </div>
    </section>
  );
}
