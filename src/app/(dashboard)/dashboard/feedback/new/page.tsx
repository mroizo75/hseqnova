import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewFeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const [users, goals] = await Promise.all([
    prisma.user.findMany({
      where: {
        tenants: {
          some: {
            tenantId,
          },
        },
      },
      select: { id: true, name: true, email: true },
      orderBy: [
        { name: "asc" },
        { email: "asc" },
      ],
    }),
    prisma.goal.findMany({
      where: { tenantId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/dashboard/feedback">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til oversikten
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Registrer kunde-ros</h1>
          <p className="text-muted-foreground">
            Dokumenter positive tilbakemeldinger og koble dem mot mål eller oppfølging.
          </p>
        </div>
      </div>

      <FeedbackForm users={users} goals={goals} />
    </div>
  );
}

