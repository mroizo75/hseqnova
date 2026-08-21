import type { Metadata } from "next";
import {
  PAGE_METADATA,
  getOpenGraphDefaults,
  getTwitterDefaults,
  getCanonicalUrl,
  ROBOTS_CONFIG,
  SITE_CONFIG,
} from "@/lib/seo-config";

export const metadata: Metadata = {
  title: PAGE_METADATA.komplettPakke.title,
  description: PAGE_METADATA.komplettPakke.description,
  keywords: PAGE_METADATA.komplettPakke.keywords,
  authors: [{ name: SITE_CONFIG.name }],
  alternates: {
    canonical: getCanonicalUrl("/komplett-pakke"),
  },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(
    PAGE_METADATA.komplettPakke.title,
    PAGE_METADATA.komplettPakke.description,
    "/komplett-pakke"
  ),
  twitter: getTwitterDefaults(
    PAGE_METADATA.komplettPakke.title,
    PAGE_METADATA.komplettPakke.description
  ),
};

export default function KomplettPakkeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen">{children}</main>;
}
