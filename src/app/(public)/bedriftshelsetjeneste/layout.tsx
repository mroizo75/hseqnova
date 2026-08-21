import type { Metadata } from "next";
import {
  PAGE_METADATA,
  SITE_CONFIG,
  getOpenGraphDefaults,
  getTwitterDefaults,
  getCanonicalUrl,
  ROBOTS_CONFIG,
} from "@/lib/seo-config";

export const metadata: Metadata = {
  title: PAGE_METADATA.bht.title,
  description: PAGE_METADATA.bht.description,
  keywords: PAGE_METADATA.bht.keywords,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  alternates: {
    canonical: getCanonicalUrl("/bedriftshelsetjeneste"),
  },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(
    PAGE_METADATA.bht.title,
    PAGE_METADATA.bht.description,
    "/bedriftshelsetjeneste"
  ),
  twitter: getTwitterDefaults(
    PAGE_METADATA.bht.title,
    PAGE_METADATA.bht.description
  ),
};

export default function BHTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>

      <main className="min-h-screen">{children}</main>

    </>
  );
}

