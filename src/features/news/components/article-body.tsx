import { sanitizeArticleHtml } from "@/lib/news/news-sanitize";
import { cn } from "@/lib/utils";

type ArticleBodyProps = {
  html: string;
  className?: string;
};

export function ArticleBody({ html, className }: ArticleBodyProps) {
  return (
    <div
      className={cn(
        "prose prose-lg max-w-none prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight",
        "prose-a:text-emerald-800 prose-a:underline-offset-4 hover:prose-a:text-emerald-950",
        "prose-img:rounded-sm prose-blockquote:border-emerald-700 prose-table:text-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(html) }}
    />
  );
}
