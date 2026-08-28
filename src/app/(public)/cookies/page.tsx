import type { Metadata } from "next";
import { CookiesContent } from "./cookies-content";
import {
  getCanonicalUrl,
  ROBOTS_CONFIG,
  getOpenGraphDefaults,
  getTwitterDefaults,
} from "@/lib/seo-config";

const title = "Cookie Policy | HSEQ Nova";
const description =
  "How HSEQ Nova uses cookies. PECR-compliant overview of essential, functional, analytics and marketing cookies. Manage your cookie preferences.";

export const metadata: Metadata = {
  title,
  description,
  robots: ROBOTS_CONFIG,
  alternates: {
    canonical: getCanonicalUrl("/cookies"),
  },
  openGraph: getOpenGraphDefaults(title, description, "/cookies"),
  twitter: getTwitterDefaults(title, description),
};

export default function CookiesPage() {
  return <CookiesContent />;
}
