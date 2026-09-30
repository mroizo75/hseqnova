import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatArticleDate } from "@/lib/news/news-content";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/news/news-types";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { cn } from "@/lib/utils";
import { listAdminArticles } from "@/server/queries/news-admin.queries";

export const metadata: Metadata = {
  title: "News | HSEQ Nova Admin",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

function parseStatus(value: string | undefined): ArticleStatus | undefined {
  return ARTICLE_STATUSES.includes(value as ArticleStatus) ? (value as ArticleStatus) : undefined;
}

function statusVariant(status: ArticleStatus): "default" | "secondary" | "outline" {
  if (status === "PUBLISHED") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

function filterHref(status: ArticleStatus | undefined, q: string): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/news?${query}` : "/admin/news";
}

export default async function AdminNewsPage({ searchParams }: Props) {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    redirect("/admin");
  }

  const params = await searchParams;
  const status = parseStatus(params.status);
  const q = (params.q ?? "").trim().slice(0, 100);
  const articles = await listAdminArticles({ status, search: q });
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">News</h1>
          <p className="text-muted-foreground">Articles published on /news</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="bg-transparent text-foreground">
            <Link href="/admin/news/categories">Categories</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/news/new">New article</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>{articles.length} articles</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {[undefined, ...ARTICLE_STATUSES].map((value) => (
              <Link
                key={value ?? "all"}
                href={filterHref(value, q)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm",
                  status === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {value ? ARTICLE_STATUS_LABELS[value] : "All"}
              </Link>
            ))}
            <form action="/admin/news" className="ml-auto flex gap-2">
              {status ? <input type="hidden" name="status" value={status} /> : null}
              <Input name="q" defaultValue={q} placeholder="Search title or slug" className="w-56" aria-label="Search articles" />
              <Button type="submit" variant="outline" className="bg-transparent text-foreground">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Publish date</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No articles found
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((article) => {
                  const scheduled =
                    article.status === "PUBLISHED" &&
                    article.publishedAt !== null &&
                    new Date(article.publishedAt).getTime() > now;
                  return (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Link href={`/admin/news/${article.id}`} className="font-medium hover:underline">
                          {article.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">/news/{article.slug}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(article.status)}>
                          {scheduled ? "Scheduled" : ARTICLE_STATUS_LABELS[article.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{article.category?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {article.publishedAt ? formatArticleDate(article.publishedAt) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{article.viewCount}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
