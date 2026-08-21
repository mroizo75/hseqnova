import type { Metadata } from "next";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "Digital site safety board UK | HSEQ Nova",
  description: "A digital safety board for UK sites: first aider, fire marshal, principal contractor, RAMS, F10, CPP and visitor induction. Standalone or as an HSEQ add-on.",
  alternates: { canonical: getCanonicalUrl("/digital-safety-board") },
  robots: ROBOTS_CONFIG,
};

export default function DigitalSafetyBoardPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Digital safety board</h1>
      <p>
        Three ways to run it: a standalone board for a site, an add-on that pulls live HSEQ data, or a hybrid per project.
        UK boards show CPP / H&amp;S file, F10, daily site register, first aider, fire marshal, RAMS and an accident tally
        without personal data on screen.
      </p>
    </div>
  );
}
