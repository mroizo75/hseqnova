import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/features/news/components/category-manager";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { listAdminCategories } from "@/server/queries/news-admin.queries";

export const metadata: Metadata = {
  title: "News categories | HSEQ Nova Admin",
  robots: { index: false, follow: false },
};

export default async function NewsCategoriesPage() {
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
        <h1 className="mt-2 text-3xl font-bold">News categories</h1>
        <p className="text-muted-foreground">
          Each category gets its own page at /news/category/… and appears as a filter on /news.
        </p>
      </div>
      <CategoryManager categories={categories} />
    </div>
  );
}
