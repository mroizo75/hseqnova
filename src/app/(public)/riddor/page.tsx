import type { Metadata } from "next";
import { getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";

export const metadata: Metadata = {
  title: "RIDDOR and digital accident book | HSEQ Nova",
  description: "Record workplace accidents in a digital accident book. RIDDOR deaths, specified injuries, over-seven-day injuries and occupational diseases get the correct reporting deadline.",
  alternates: { canonical: getCanonicalUrl("/riddor") },
  robots: ROBOTS_CONFIG,
};

export default function RiddorPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl prose prose-neutral dark:prose-invert">
      <h1>Digital accident book and RIDDOR</h1>
      <p>
        UK employers must record accidents. Under RIDDOR 2013, certain events must also be reported to the HSE —
        immediately for deaths, within 10 days for specified injuries, and within 15 days for over-seven-day injuries.
      </p>
      <p>
        HSEQ Nova keeps a digital accident book (Social Security (Claims and Payments) Regulations 1979) and flags
        reportable events with the correct deadline. Personal details stay off the public safety board.
      </p>
    </div>
  );
}
