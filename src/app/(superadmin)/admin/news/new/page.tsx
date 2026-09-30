import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArticleForm } from "@/features/news/components/article-form";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { listAdminCategories } from "@/server/queries/news-admin.queries";

export const metadata: Metadata = {
  title: "New article | HSEQ Nova Admin",
  robots: { index: false, follow: false },
};

export default async function NewArticlePage() {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    redirect("/admin");
  }
  const categories = await listAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/news" className="text-sm text-muted-foreground hover:underline">
          ← All articles
        </Link>
        <h1 className="mt-2 text-3xl font-bold">New article</h1>
      </div>
      <ArticleForm categories={categories} />
    </div>
  );
}
