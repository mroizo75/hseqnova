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
  title: PAGE_METADATA.kurs.title,
  description: PAGE_METADATA.kurs.description,
  keywords: PAGE_METADATA.kurs.keywords,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  alternates: {
    canonical: getCanonicalUrl("/hms-kurs"),
  },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(
    PAGE_METADATA.kurs.title,
    PAGE_METADATA.kurs.description,
    "/hms-kurs"
  ),
  twitter: getTwitterDefaults(
    PAGE_METADATA.kurs.title,
    PAGE_METADATA.kurs.description
  ),
};

export default function HMSKursLayout({
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

