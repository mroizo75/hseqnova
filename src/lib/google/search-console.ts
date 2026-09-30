import { SITE_CONFIG } from "@/lib/seo-config";
import {
  GOOGLE_TOKEN_URL,
  SEARCH_CONSOLE_SCOPE,
  buildServiceAccountAssertion,
  normalizePrivateKey,
  resolveSearchConsoleProperty,
  resolveSitemapUrl,
  type DateRange,
  type SearchAnalyticsRow,
} from "@/lib/google/search-console-core";

const API_BASE = "https://www.googleapis.com/webmasters/v3";
const REQUEST_TIMEOUT_MS = 10_000;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

type SearchConsoleConfig = {
  clientEmail: string;
  privateKey: string;
  property: string;
};

type CachedToken = { value: string; expiresAt: number };

export type SearchConsoleDimension = "query" | "page" | "date" | "country" | "device";

export type SearchAnalyticsRequest = DateRange & {
  dimensions?: SearchConsoleDimension[];
  rowLimit?: number;
  pageContains?: string;
};

export type SitemapStatus = {
  path: string;
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  warnings: number;
  errors: number;
  submitted: number;
  indexed: number | null;
};

type RawSitemap = {
  path?: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  warnings?: string | number;
  errors?: string | number;
  contents?: Array<{ submitted?: string | number; indexed?: string | number }>;
};

let cachedToken: CachedToken | null = null;

function readConfig(): SearchConsoleConfig | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !rawKey) {
    return null;
  }
  return {
    clientEmail,
    privateKey: normalizePrivateKey(rawKey),
    property: getSearchConsoleProperty(),
  };
}

function requireConfig(): SearchConsoleConfig {
  const config = readConfig();
  if (!config) {
    throw {
      code: "GSC_NOT_CONFIGURED",
      message: "Google Search Console is not connected. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    };
  }
  return config;
}

export function isSearchConsoleConfigured(): boolean {
  return readConfig() !== null;
}

export function getSearchConsoleProperty(): string {
  return resolveSearchConsoleProperty(SITE_CONFIG.url, process.env.GSC_SITE_URL);
}

export function getSitemapUrl(): string {
  return resolveSitemapUrl(SITE_CONFIG.url, getSearchConsoleProperty());
}

async function getAccessToken(config: SearchConsoleConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return cachedToken.value;
  }

  let assertion: string;
  try {
    assertion = buildServiceAccountAssertion({
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
      scope: SEARCH_CONSOLE_SCOPE,
      now: new Date(),
    });
  } catch {
    throw { code: "GSC_INVALID_KEY", message: "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not a valid PEM private key." };
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw {
      code: "GSC_AUTH_FAILED",
      message: `Google rejected the service account: ${payload.error_description ?? response.statusText}`,
    };
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

async function listAccessibleProperties(token: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }> };
  return (payload.siteEntry ?? []).map((entry) => `${entry.siteUrl} (${entry.permissionLevel})`);
}

async function callApi<T>(path: string, init: { method: "GET" | "POST" | "PUT"; body?: unknown }): Promise<T> {
  const config = requireConfig();
  const token = await getAccessToken(config);
  const response = await fetch(`${API_BASE}/sites/${encodeURIComponent(config.property)}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; errors?: Array<{ reason?: string }> };
    };
    const reason = payload.error?.errors?.[0]?.reason;
    if (response.status === 403 && reason === "accessNotConfigured") {
      throw {
        code: "GSC_API_DISABLED",
        message: `The Google Search Console API is not enabled for the service account's Cloud project. ${payload.error?.message ?? ""}`.trim(),
      };
    }
    if (response.status === 403) {
      const visible = await listAccessibleProperties(token).catch(() => []);
      throw {
        code: "GSC_FORBIDDEN",
        message: `The service account ${config.clientEmail} has no access to ${config.property}. Add it as an Owner in Search Console → Settings → Users and permissions. Properties it can see: ${visible.join(", ") || "none"}.`,
      };
    }
    throw {
      code: "GSC_REQUEST_FAILED",
      message: `Search Console request failed (${response.status}): ${payload.error?.message ?? response.statusText}`,
    };
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function querySearchAnalytics(request: SearchAnalyticsRequest): Promise<SearchAnalyticsRow[]> {
  const body = {
    startDate: request.startDate,
    endDate: request.endDate,
    dimensions: request.dimensions ?? [],
    rowLimit: request.rowLimit ?? 1000,
    dataState: "all",
    ...(request.pageContains
      ? {
          dimensionFilterGroups: [
            { groupType: "and", filters: [{ dimension: "page", operator: "contains", expression: request.pageContains }] },
          ],
        }
      : {}),
  };
  const result = await callApi<{ rows?: SearchAnalyticsRow[] }>("/searchAnalytics/query", { method: "POST", body });
  return result.rows ?? [];
}

function toCount(value: string | number | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function listSitemaps(): Promise<SitemapStatus[]> {
  const result = await callApi<{ sitemap?: RawSitemap[] }>("/sitemaps", { method: "GET" });
  return (result.sitemap ?? []).map((sitemap) => {
    const contents = sitemap.contents ?? [];
    const hasIndexed = contents.some((content) => content.indexed !== undefined);
    return {
      path: sitemap.path ?? "",
      lastSubmitted: sitemap.lastSubmitted ?? null,
      lastDownloaded: sitemap.lastDownloaded ?? null,
      isPending: Boolean(sitemap.isPending),
      warnings: toCount(sitemap.warnings),
      errors: toCount(sitemap.errors),
      submitted: contents.reduce((sum, content) => sum + toCount(content.submitted), 0),
      indexed: hasIndexed ? contents.reduce((sum, content) => sum + toCount(content.indexed), 0) : null,
    };
  });
}

export async function submitSitemap(sitemapUrl: string = getSitemapUrl()): Promise<void> {
  await callApi<unknown>(`/sitemaps/${encodeURIComponent(sitemapUrl)}`, { method: "PUT" });
}

/** Best-effort ping after publishing; failures surface as a stale "last submitted" date on /admin/seo. */
export async function notifySitemapChanged(): Promise<void> {
  if (!isSearchConsoleConfigured()) {
    return;
  }
  await submitSitemap().catch(() => undefined);
}
