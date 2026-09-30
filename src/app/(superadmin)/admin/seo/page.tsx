import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricsTable } from "@/features/seo/components/metrics-table";
import { SeoActionsBar } from "@/features/seo/components/seo-actions-bar";
import {
  formatCount,
  formatCtr,
  formatDateTime,
  formatIsoDay,
  formatPosition,
} from "@/features/seo/components/seo-format";
import { SeoSetupGuide } from "@/features/seo/components/seo-setup-guide";
import { SeoTrendChart } from "@/features/seo/components/seo-trend-chart";
import {
  SEO_RANGE_OPTIONS,
  parseRangeParam,
  percentChange,
  type SeoRangeDays,
} from "@/lib/google/search-console-core";
import {
  getSearchConsoleProperty,
  getSitemapUrl,
  isSearchConsoleConfigured,
} from "@/lib/google/search-console";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { cn } from "@/lib/utils";
import { getSeoDashboard, type SeoDashboard } from "@/server/queries/seo-dashboard.queries";

export const metadata: Metadata = {
  title: "Search performance | HSEQ Nova Admin",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ days?: string }>;
};

type KpiProps = {
  label: string;
  value: string;
  change: number | null;
  lowerIsBetter?: boolean;
};

function Kpi({ label, value, change, lowerIsBetter = false }: KpiProps) {
  const improved = change !== null && (lowerIsBetter ? change < 0 : change > 0);
  const worsened = change !== null && (lowerIsBetter ? change > 0 : change < 0);
  const Icon = change !== null && change < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {change === null ? (
          <p className="text-xs text-muted-foreground">No data in the previous period</p>
        ) : (
          <p
            className={cn(
              "flex items-center gap-1 text-xs",
              improved && "text-emerald-600",
              worsened && "text-red-600",
              !improved && !worsened && "text-muted-foreground"
            )}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {Math.abs(change).toFixed(1)}% vs previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RangeTabs({ active }: { active: SeoRangeDays }) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Date range">
      {SEO_RANGE_OPTIONS.map((days) => (
        <Link
          key={days}
          href={`/admin/seo?days=${days}`}
          role="tab"
          aria-selected={active === days}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            active === days ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          {days} days
        </Link>
      ))}
    </div>
  );
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Could not load data from Google Search Console.";
}

function Dashboard({ data }: { data: SeoDashboard }) {
  const { current, previous } = data.totals;

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {formatIsoDay(data.range.startDate)} – {formatIsoDay(data.range.endDate)} (Pacific Time, includes provisional
        data for the last 2–3 days) · compared with {formatIsoDay(data.previousRange.startDate)} –{" "}
        {formatIsoDay(data.previousRange.endDate)} · fetched {formatDateTime(data.fetchedAt)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Clicks" value={formatCount(current.clicks)} change={percentChange(current.clicks, previous.clicks)} />
        <Kpi
          label="Impressions"
          value={formatCount(current.impressions)}
          change={percentChange(current.impressions, previous.impressions)}
        />
        <Kpi label="Click-through rate" value={formatCtr(current.ctr)} change={percentChange(current.ctr, previous.ctr)} />
        <Kpi
          label="Average position"
          value={formatPosition(current.position)}
          change={percentChange(current.position, previous.position)}
          lowerIsBetter
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks and impressions per day</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoTrendChart points={data.trend} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top search queries</CardTitle>
            <CardDescription>What people typed before clicking through to the site.</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsTable
              labelHeading="Query"
              emptyMessage="No queries yet"
              rows={data.topQueries.map((row) => ({ ...row, key: row.query, label: row.query }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Striking distance</CardTitle>
            <CardDescription>
              Queries ranking in positions 4–20. Improving the matching page (title, headings, answer near the top,
              internal links) is the quickest way to gain clicks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsTable
              labelHeading="Query"
              emptyMessage="No queries in positions 4–20 with at least 10 impressions"
              rows={data.strikingDistance.map((row) => ({ ...row, key: row.query, label: row.query }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top pages</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsTable
            labelHeading="Page"
            emptyMessage="No pages with impressions yet"
            rows={data.topPages.map((row) => ({
              ...row,
              key: row.url,
              label: (
                <a href={row.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {row.path}
                </a>
              ),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">News articles</CardTitle>
          <CardDescription>Search performance for pages under /news.</CardDescription>
        </CardHeader>
        <CardContent>
          <MetricsTable
            labelHeading="Article"
            emptyMessage="No news pages have appeared in search yet"
            rows={data.articles.map((row) => ({
              ...row,
              key: row.url,
              label: row.articleId ? (
                <div>
                  <Link href={`/admin/news/${row.articleId}`} className="font-medium hover:underline">
                    {row.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.path}</p>
                </div>
              ) : (
                row.path
              ),
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sitemaps</CardTitle>
          <CardDescription>What Google has read from the submitted sitemaps.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sitemap</TableHead>
                <TableHead>Last submitted</TableHead>
                <TableHead>Last read by Google</TableHead>
                <TableHead className="text-right">URLs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sitemaps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sitemap submitted yet. Use Submit sitemap above.
                  </TableCell>
                </TableRow>
              ) : (
                data.sitemaps.map((sitemap) => (
                  <TableRow key={sitemap.path}>
                    <TableCell className="break-all">{sitemap.path}</TableCell>
                    <TableCell>{formatDateTime(sitemap.lastSubmitted)}</TableCell>
                    <TableCell>{formatDateTime(sitemap.lastDownloaded)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(sitemap.submitted)}</TableCell>
                    <TableCell>
                      {sitemap.errors > 0 ? (
                        <Badge variant="destructive">{sitemap.errors} errors</Badge>
                      ) : sitemap.isPending ? (
                        <Badge variant="secondary">Pending</Badge>
                      ) : sitemap.warnings > 0 ? (
                        <Badge variant="outline">{sitemap.warnings} warnings</Badge>
                      ) : (
                        <Badge>OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default async function SeoPage({ searchParams }: Props) {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    redirect("/admin");
  }

  const days = parseRangeParam((await searchParams).days);
  const property = getSearchConsoleProperty();
  const configured = isSearchConsoleConfigured();

  let data: SeoDashboard | null = null;
  let loadError: string | null = null;
  if (configured) {
    try {
      data = await getSeoDashboard(days);
    } catch (error) {
      loadError = errorMessage(error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Search performance</h1>
          <p className="text-muted-foreground">Google Search Console · {property}</p>
        </div>
        {configured ? <SeoActionsBar /> : null}
      </div>

      {configured ? <RangeTabs active={days} /> : null}

      {!configured ? <SeoSetupGuide property={property} sitemapUrl={getSitemapUrl()} /> : null}

      {loadError ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Search Console is not responding as expected</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {data ? <Dashboard data={data} /> : null}
    </div>
  );
}
