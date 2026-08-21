import type { Metadata } from "next";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "RAMS software UK | HSEQ Nova",
  description: "Risk assessments and method statements for UK construction. RAMS is an add-on on HSEQ Nova, linked to CDM duty holders, the construction phase plan and F10.",
  alternates: { canonical: getCanonicalUrl("/rams") },
  robots: ROBOTS_CONFIG,
};

export default function RamsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>RAMS — risk assessments and method statements</h1>
      <p>
        Construction teams need RAMS that match the task, the site and CDM 2015. HSEQ Nova treats RAMS as a construction
        add-on, not a translated Norwegian SJA. Method statements sit with the live risk assessment, not a static Word file.
      </p>
    </div>
  );
}
