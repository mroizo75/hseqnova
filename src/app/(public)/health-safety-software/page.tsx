import type { Metadata } from "next";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Health and safety software UK | HSEQ Nova",
  description: "HSEQ software built for HSWA, MHSWR, RIDDOR, COSHH and CDM 2015. Not a translated Norwegian HMS system.",
  alternates: { canonical: getCanonicalUrl("/health-safety-software") },
  robots: ROBOTS_CONFIG,
};

export default function HealthSafetySoftwarePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Health and safety software for the UK</h1>
      <p>
        HSEQ Nova is for UK employers who need a living policy, an accident book, risk assessments and proof for
        CHAS, Constructionline and other SSIP schemes. Core HSEQ is on for every company. Construction, COSHH, food
        and other industry packs are add-ons.
      </p>
    </div>
  );
}
