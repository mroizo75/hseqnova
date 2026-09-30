import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { displayFont, marketingFont } from "@/fonts";
import { ArticleView } from "@/features/news/components/article-view";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { getAdminArticle } from "@/server/queries/news-admin.queries";

export const metadata: Metadata = {
  title: "Preview | HSEQ Nova Admin",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePreviewPage({ params }: Props) {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    redirect("/admin");
  }

  const { id } = await params;
  const article = await getAdminArticle(id);
  if (!article) {
    notFound();
  }

  return (
    <div className={`${displayFont.variable} ${marketingFont.variable} -m-3 font-marketing sm:-m-4 lg:-m-8`}>
      <p className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Preview — status: {article.status.toLowerCase()}. This page is only visible to super admins.
      </p>
      <ArticleView article={article} related={[]} />
    </div>
  );
}
