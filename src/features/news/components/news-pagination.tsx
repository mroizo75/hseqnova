import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type NewsPaginationProps = {
  basePath: string;
  page: number;
  pageCount: number;
};

export function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function NewsPagination({ basePath, page, pageCount }: NewsPaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const linkClass =
    "inline-flex min-h-11 items-center gap-2 rounded-sm border border-[hsl(var(--home-rule))] bg-transparent px-4 text-sm font-medium text-[hsl(var(--home-ink))] hover:bg-white";

  return (
    <nav aria-label="News pages" className="mt-12 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={pageHref(basePath, page - 1)} rel="prev" className={linkClass}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Newer articles
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-[hsl(var(--home-ink)/0.6)]">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={pageHref(basePath, page + 1)} rel="next" className={linkClass}>
          Older articles
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
