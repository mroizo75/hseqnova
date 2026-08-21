import type { Metadata } from "next";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Living health and safety policy UK | HSEQ Nova",
  description: "A living H&S policy: statement of intent, organisation and arrangements that link to live modules. Written for HSWA s.2(3), not a translated Norwegian handbook.",
  alternates: { canonical: getCanonicalUrl("/health-and-safety-policy") },
  robots: ROBOTS_CONFIG,
};

export default function HealthAndSafetyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Living health and safety policy</h1>
      <p>
        Employers with five or more employees must have a written policy (HSWA s.2(3)). HSEQ Nova structures it as
        statement of intent, organisation and arrangements. Arrangements link to live modules — the policy is the table
        of contents, not a copy of every procedure.
      </p>
    </div>
  );
}
