import { createSign } from "node:crypto";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters";
export const SEO_RANGE_OPTIONS = [7, 28, 90] as const;

export type SeoRangeDays = (typeof SEO_RANGE_OPTIONS)[number];

export type DateRange = { startDate: string; endDate: string };

export type SearchAnalyticsRow = {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

const EMPTY_METRICS: SearchMetrics = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

export function parseRangeParam(value: string | string[] | undefined): SeoRangeDays {
  const raw = Number(Array.isArray(value) ? value[0] : value);
  return SEO_RANGE_OPTIONS.find((option) => option === raw) ?? 28;
}

/** Search Console reports dates in Pacific Time. */
export function pacificIsoDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The current window ends yesterday (PT); the previous window is the same length immediately before it. */
export function buildComparisonRanges(days: number, now: Date): { current: DateRange; previous: DateRange } {
  const endDate = shiftIsoDate(pacificIsoDate(now), -1);
  const startDate = shiftIsoDate(endDate, -(days - 1));
  const previousEnd = shiftIsoDate(startDate, -1);
  return {
    current: { startDate, endDate },
    previous: { startDate: shiftIsoDate(previousEnd, -(days - 1)), endDate: previousEnd },
  };
}

export function toMetrics(row: SearchAnalyticsRow | undefined): SearchMetrics {
  if (!row) {
    return EMPTY_METRICS;
  }
  return { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}

/** Queries ranking just off the top positions with real demand: the cheapest ranking wins. */
export function findStrikingDistance(
  rows: SearchAnalyticsRow[],
  options: { minPosition?: number; maxPosition?: number; minImpressions?: number; limit?: number } = {}
): SearchAnalyticsRow[] {
  const { minPosition = 4, maxPosition = 20, minImpressions = 10, limit = 15 } = options;
  return rows
    .filter((row) => row.position >= minPosition && row.position <= maxPosition && row.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

export function urlToPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || "/";
  } catch {
    return url;
  }
}

/** A DNS-verified Domain property is addressed as `sc-domain:example.com`. */
export function resolveSearchConsoleProperty(siteUrl: string, override: string | undefined): string {
  const explicit = override?.trim();
  if (explicit) {
    return explicit;
  }
  const hostname = new URL(siteUrl).hostname.replace(/^www\./, "");
  return `sc-domain:${hostname}`;
}

/** Google only accepts sitemaps inside the property, so a localhost app URL falls back to the property domain. */
export function resolveSitemapUrl(siteUrl: string, property: string): string {
  const domain = property.startsWith("sc-domain:") ? property.slice("sc-domain:".length) : new URL(property).hostname;
  const siteHost = new URL(siteUrl).hostname;
  const origin = siteHost === domain || siteHost.endsWith(`.${domain}`) ? siteUrl : `https://${domain}`;
  return `${origin.replace(/\/+$/, "")}/sitemap.xml`;
}

/** Env files usually store the PEM key on one line with literal `\n`. */
export function normalizePrivateKey(raw: string): string {
  return raw.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

export function buildServiceAccountAssertion(params: {
  clientEmail: string;
  privateKey: string;
  scope: string;
  now: Date;
}): string {
  const issuedAt = Math.floor(params.now.getTime() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: params.clientEmail,
      scope: params.scope,
      aud: GOOGLE_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    })
  );
  const unsigned = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(params.privateKey);
  return `${unsigned}.${base64Url(signature)}`;
}
