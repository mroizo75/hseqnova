import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FeedbackSummary } from "@/features/feedback/components/feedback-summary";
import { FeedbackList } from "@/features/feedback/components/feedback-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CustomerFeedback } from "@prisma/client";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const [feedbacks, users, goals] = await Promise.all([
    prisma.customerFeedback.findMany({
      where: { tenantId },
      include: {
        recordedBy: { select: { name: true, email: true } },
        followUpOwner: { select: { name: true, email: true } },
      },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        tenants: {
          some: {
            tenantId,
          },
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.goal.findMany({
      where: { tenantId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const positiveCount = feedbacks.filter((f) => f.sentiment === "POSITIVE").length;
  const followUpCount = feedbacks.filter((f) => f.followUpStatus === "FOLLOW_UP").length;
  const sharedCount = feedbacks.filter((f) => f.followUpStatus === "ACKNOWLEDGED" || f.followUpStatus === "SHARED").length;
  const ratings = feedbacks
    .map((f) => f.rating)
    .filter((value): value is number => typeof value === "number");
  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, current) => sum + current, 0) / ratings.length : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold">Kundetilbakemeldinger</h1>
            <p className="text-muted-foreground">
              ISO 9001 – dokumenter og del positive erfaringer fra kunder (9.1.2 Kundetilfredshet)
            </p>
          </div>
          <PageHelpDialog content={helpContent.feedback} />
        </div>
        <Button asChild>
          <Link href="/dashboard/feedback/new">Ny tilbakemelding</Link>
        </Button>
      </div>

      <FeedbackSummary
        total={feedbacks.length}
        positiveCount={positiveCount}
        averageRating={averageRating}
        followUpCount={followUpCount}
        sharedCount={sharedCount}
      />

      <FeedbackList feedbacks={feedbacks} users={users} />
    </div>
  );
}

