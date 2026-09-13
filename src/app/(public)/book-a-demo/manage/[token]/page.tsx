import type { Metadata } from "next";
import { PAGE_METADATA, getCanonicalUrl, ROBOTS_CONFIG } from "@/lib/seo-config";
import { ManageDemoClient } from "@/features/demo-booking/components/manage-demo-client";

export const metadata: Metadata = {
  title: "Manage your demo | HSEQ Nova",
  description: PAGE_METADATA.bookDemo.description,
  alternates: { canonical: getCanonicalUrl("/book-a-demo") },
  robots: { index: false, follow: false },
};

export default async function ManageDemoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="home-marketing font-marketing">
      <section className="container mx-auto max-w-5xl px-4 py-16 lg:py-20">
        <ManageDemoClient token={token} />
      </section>
    </div>
  );
}
