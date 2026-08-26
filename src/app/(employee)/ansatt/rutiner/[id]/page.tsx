import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function EmployeeProcedureDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const routine = await prisma.routine.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
      status: "ACTIVE",
    },
    include: {
      responsibleUser: {
        select: { name: true, email: true },
      },
    },
  });

  if (!routine) {
    notFound();
  }

  const contentHtml =
    routine.content && typeof routine.content === "string"
      ? routine.content
      : routine.content && typeof routine.content === "object"
        ? (routine.content as { html?: string }).html ?? null
        : null;

  return (
    <div className="space-y-6">
      <Link href="/ansatt/rutiner">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to procedures
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{routine.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {routine.category && (
                  <Badge variant="outline">{routine.category}</Badge>
                )}
                {routine.legalReference && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {routine.legalReference}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {routine.responsibleUser && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Owner: {routine.responsibleUser.name || routine.responsibleUser.email}
              </span>
            )}
            {routine.lastReviewedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Last reviewed: {format(new Date(routine.lastReviewedAt), "d MMM yyyy")}
              </span>
            )}
            {routine.nextReviewAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Next review: {format(new Date(routine.nextReviewAt), "d MMM yyyy")}
              </span>
            )}
          </div>

          {routine.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm">{routine.description}</p>
            </div>
          )}

          {contentHtml && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}

          {!contentHtml && !routine.description && (
            <p className="text-muted-foreground text-sm italic">
              No content available for this procedure.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
