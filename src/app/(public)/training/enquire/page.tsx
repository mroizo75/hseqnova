import type { Metadata } from "next";
import Link from "next/link";
import { TrainingEnquiryForm } from "@/features/training-sales/components/training-enquiry-form";
import { TRAINING_COURSES, trainingCourseByKey } from "@/features/training-sales/lib/catalogue";
import {
  getCanonicalUrl,
  getOpenGraphDefaults,
  getTwitterDefaults,
  ROBOTS_CONFIG,
} from "@/lib/seo-config";

const PAGE_TITLE = "Book workplace training | HSEQ Nova";
const PAGE_DESCRIPTION =
  "Request work at height, MEWP, pallet truck or scaffold training. We confirm the date, invoice in pounds, and contact you before the competence record expires.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: getCanonicalUrl("/training/enquire") },
  robots: ROBOTS_CONFIG,
  openGraph: getOpenGraphDefaults(PAGE_TITLE, PAGE_DESCRIPTION, "/training/enquire"),
  twitter: getTwitterDefaults(PAGE_TITLE, PAGE_DESCRIPTION),
};

export default async function TrainingEnquirePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const courseKey = (await searchParams).course;
  const selected = trainingCourseByKey(courseKey) ?? TRAINING_COURSES[0];

  return (
    <div className="home-marketing font-marketing">
      <section className="border-b border-[hsl(var(--home-rule))] bg-[hsl(var(--home-ink))] text-[hsl(var(--home-ink-fg))]">
        <div className="container mx-auto max-w-3xl px-4 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Workplace training</p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight">Book a course</h1>
          <p className="mt-4 max-w-xl text-white/75">
            Tell us the company, the course and how many people. We confirm the date and send a Stripe invoice. The competence record and a renewal contact are kept in our CRM.
          </p>
        </div>
      </section>
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <TrainingEnquiryForm
          courses={TRAINING_COURSES.map((course) => ({ key: course.key, title: course.title }))}
          initialCourseKey={selected.key}
        />
        <p className="mt-6 text-sm text-[hsl(var(--home-ink)/0.65)]">
          <Link href="/training" className="underline underline-offset-4">
            Back to the catalogue
          </Link>
          . These courses are competence training. They do not issue an IPAF, PASMA or CISRS card.
        </p>
      </section>
    </div>
  );
}
