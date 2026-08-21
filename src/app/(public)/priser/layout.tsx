import type { Metadata } from "next";
import {
  PAGE_METADATA,
  getOpenGraphDefaults,
  getTwitterDefaults,
  getCanonicalUrl,
  ROBOTS_CONFIG,
} from "@/lib/seo-config";

export const metadata: Metadata = {
  title: PAGE_METADATA.priser.title,
  description: PAGE_METADATA.priser.description,
  keywords: PAGE_METADATA.priser.keywords,
  alternates: {
    canonical: getCanonicalUrl("/priser"),
  },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(
    PAGE_METADATA.priser.title,
    PAGE_METADATA.priser.description,
    "/priser"
  ),
  twitter: getTwitterDefaults(
    PAGE_METADATA.priser.title,
    PAGE_METADATA.priser.description
  ),
};

export default function PriserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

