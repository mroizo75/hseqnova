import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo-config";

const PRIVATE_PATHS = ["/dashboard/", "/admin/", "/ansatt/", "/enterprise/", "/api/", "/tavle/"];

// Longest match wins, so article images stay crawlable under the /api/ disallow.
const PUBLIC_MEDIA_PATH = "/api/files/blog/images/";

const AUTH_PATHS = ["/login", "/reset-password", "/forgot-password", "/book-a-demo/manage/"];

const AI_ANSWER_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", PUBLIC_MEDIA_PATH],
        disallow: [...PRIVATE_PATHS, ...AUTH_PATHS],
      },
      {
        userAgent: AI_ANSWER_BOTS,
        allow: ["/", "/news/", "/llms.txt", PUBLIC_MEDIA_PATH],
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: "Bytespider",
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
