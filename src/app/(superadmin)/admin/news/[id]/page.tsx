import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleForm } from "@/features/news/components/article-form";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { getAdminArticle, listAdminCategories } from "@/server/queries/news-admin.queries";

export const metadata: Metadata = {
  title: "Edit article | HSEQ Nova Admin",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    redirect("/admin");
  }

  const { id } = await params;
  const [article, categories] = await Promise.all([getAdminArticle(id), listAdminCategories()]);
  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/news" className="text-sm text-muted-foreground hover:underline">
          ← All articles
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Edit article</h1>
      </div>
      <ArticleForm key={article.updatedAt} article={article} categories={categories} />
    </div>
  );
}
