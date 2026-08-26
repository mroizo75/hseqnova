import { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url;
  const currentDate = new Date();

  const paths = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/register", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/health-safety-software", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/health-and-safety-policy", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/digital-safety-board", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/riddor", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/rams", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/coshh", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/team", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/personvern", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/vilkar", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return paths.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency,
    priority,
  }));
}
