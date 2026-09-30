import { absoluteUrl, articlePath } from "@/lib/news/news-content";
import { listPublishedArticles } from "@/lib/news/news-queries";
import { SITE_CONFIG } from "@/lib/seo-config";

export const dynamic = "force-dynamic";

const KEY_PAGES = [
  { path: "/health-safety-software", title: "Health and safety software", note: "Core HSEQ modules for UK employers" },
  { path: "/riddor", title: "Digital accident book and RIDDOR", note: "RIDDOR 2013 deadlines: without delay, 10 days, 15 days" },
  { path: "/health-and-safety-policy", title: "Living health and safety policy", note: "Statement, organisation and arrangements under HSWA s.2(3)" },
  { path: "/rams", title: "RAMS", note: "Risk assessments and method statements for construction" },
  { path: "/coshh", title: "COSHH", note: "COSHH 2002 assessments and 40-year health records" },
  { path: "/digital-safety-board", title: "Digital site safety board", note: "CDM 2015 site information" },
  { path: "/pricing", title: "Pricing", note: "Per company, unlimited users, GBP excluding VAT" },
  { path: "/about", title: "About HSEQ Nova", note: "" },
  { path: "/contact", title: "Contact", note: "" },
  { path: "/news", title: "News and guidance", note: "Articles on UK health and safety duties" },
];

const RECENT_ARTICLES = 20;

async function recentArticleLines(): Promise<string[]> {
  try {
    const { items } = await listPublishedArticles({ page: 1, pageSize: RECENT_ARTICLES });
    return items.map((item) => `- [${item.title}](${absoluteUrl(articlePath(item.slug))}): ${item.excerpt}`);
  } catch {
    return [];
  }
}

export async function GET() {
  const articles = await recentArticleLines();
  const pages = KEY_PAGES.map(
    (page) => `- [${page.title}](${absoluteUrl(page.path)})${page.note ? `: ${page.note}` : ""}`
  );

  const body = [
    `# ${SITE_CONFIG.name}`,
    "",
    `> ${SITE_CONFIG.description}`,
    "",
    "HSEQ Nova is software, not health and safety consultancy. It does not replace the duty to appoint competent help under MHSWR 1999 regulation 7. Legal references on this site point to legislation.gov.uk and HSE.gov.uk.",
    "",
    "## Key pages",
    ...pages,
    ...(articles.length > 0 ? ["", "## Recent articles", ...articles] : []),
    "",
    "## Contact",
    `- Email: ${SITE_CONFIG.contactEmail}`,
    `- Phone: ${SITE_CONFIG.contactPhone}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
