import type { Metadata } from "next";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "COSHH assessment software UK | HSEQ Nova",
  description: "COSHH 2002 assessments, SDS and health surveillance records. Hazardous substances are an add-on on HSEQ Nova.",
  alternates: { canonical: getCanonicalUrl("/coshh") },
  robots: ROBOTS_CONFIG,
};

export default function CoshhPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>COSHH assessments</h1>
      <p>
        The Control of Substances Hazardous to Health Regulations 2002 require a suitable and sufficient assessment
        before work with hazardous substances. Health records must be kept for 40 years where surveillance is required.
      </p>
    </div>
  );
}
