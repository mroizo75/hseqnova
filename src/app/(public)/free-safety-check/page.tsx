import type { Metadata } from "next";
import { SafetyCheck } from "@/features/safety-check/components/safety-check";
import {
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  PAGE_METADATA,
  ROBOTS_CONFIG,
} from "@/lib/seo-config";

const pageTitle = PAGE_METADATA.safetyCheck.title;
const pageDescription = PAGE_METADATA.safetyCheck.description;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: getCanonicalUrl("/free-safety-check") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(pageTitle, pageDescription, "/free-safety-check"),
  twitter: getTwitterDefaults(pageTitle, pageDescription),
};

export default function FreeSafetyCheckPage() {
  return (
    <div className="home-marketing font-marketing">
      <SafetyCheck />
    </div>
  );
}
