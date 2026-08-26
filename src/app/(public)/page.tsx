import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";
import { MultipleStructuredData } from "@/components/seo/structured-data";
import { getHomePageJsonLd } from "@/lib/homepage-content";
import {
  PAGE_METADATA,
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
} from "@/lib/seo-config";

const homeTitle = PAGE_METADATA.home.title;
const homeDescription = PAGE_METADATA.home.description;

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: PAGE_METADATA.home.keywords,
  alternates: { canonical: getCanonicalUrl("/") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(homeTitle, homeDescription, "/"),
  twitter: getTwitterDefaults(homeTitle, homeDescription),
};

export default function Page() {
  return (
    <>
      <MultipleStructuredData dataArray={getHomePageJsonLd()} />
      <HomePage />
    </>
  );
}
