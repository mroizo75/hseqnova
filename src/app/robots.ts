import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/*",
          "/admin/*",
          "/ansatt/*",
          "/api/*",
          "/login",
          "/reset-password",
          "/forgot-password",
          "/registrer-bedrift/takk",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: [
          "/",
          "/priser",
          "/hms-kurs",
          "/bedriftshelsetjeneste",
          "/komplett-pakke",
          "/hms-handbok",
          "/risikovurdering-mal",
          "/vernerunde-guide",
          "/iso-9001-sjekkliste",
          "/hms-lover-regler",
          "/hms-system",
          "/hms-system/*",
          "/blogg",
          "/blogg/*",
        ],
        disallow: [
          "/dashboard/*",
          "/admin/*",
          "/ansatt/*",
          "/api/*",
        ],
      },
      {
        userAgent: "PerplexityBot",
        allow: [
          "/",
          "/priser",
          "/hms-kurs",
          "/bedriftshelsetjeneste",
          "/komplett-pakke",
          "/hms-handbok",
          "/risikovurdering-mal",
          "/vernerunde-guide",
          "/iso-9001-sjekkliste",
          "/hms-lover-regler",
          "/hms-system",
          "/hms-system/*",
          "/blogg",
          "/blogg/*",
        ],
        disallow: [
          "/dashboard/*",
          "/admin/*",
          "/ansatt/*",
          "/api/*",
        ],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/blogg", "/blogg/*"],
        disallow: [
          "/dashboard/*",
          "/admin/*",
          "/ansatt/*",
          "/api/*",
        ],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/blogg", "/blogg/*"],
        disallow: [
          "/dashboard/*",
          "/admin/*",
          "/ansatt/*",
          "/api/*",
        ],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/blogg", "/blogg/*"],
        disallow: [
          "/dashboard/*",
          "/admin/*",
          "/ansatt/*",
          "/api/*",
        ],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/blogg", "/blogg/*"],
      },
      {
        userAgent: "Bytespider",
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  };
}
