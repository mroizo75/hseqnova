import { absoluteUrl, articlePath, escapeXml, NEWS_BASE_PATH } from "@/lib/news/news-content";
import { listPublishedArticles } from "@/lib/news/news-queries";
import { SITE_CONFIG } from "@/lib/seo-config";

export const dynamic = "force-dynamic";

const FEED_SIZE = 50;

export async function GET() {
  const { items } = await listPublishedArticles({ page: 1, pageSize: FEED_SIZE });
  const feedUrl = absoluteUrl(`${NEWS_BASE_PATH}/rss.xml`);
  const lastBuild = items[0]?.updatedAt ?? new Date().toISOString();

  const entries = items
    .map((item) => {
      const url = absoluteUrl(articlePath(item.slug));
      const pubDate = new Date(item.publishedAt ?? item.updatedAt).toUTCString();
      const category = item.category ? `\n      <category>${escapeXml(item.category.name)}</category>` : "";
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(item.excerpt)}</description>${category}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE_CONFIG.name} News`)}</title>
    <link>${escapeXml(absoluteUrl(NEWS_BASE_PATH))}</link>
    <description>${escapeXml("Health and safety guidance and product news for UK employers.")}</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
