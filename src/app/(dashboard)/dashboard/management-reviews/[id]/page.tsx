import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getPermissions } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { ArrowLeft, Edit, FileText, Calendar, Users, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { ApproveManagementReviewButton } from "@/components/management-review/approve-button";

async function getManagementReview(id: string, tenantId: string) {
  const review = await db.managementReview.findFirst({
    where: {
      id,
      tenantId,
    },
  });

  if (!review) return null;

  // Hent bruker-navn for conductedBy og approvedBy
  const conductedByUser = review.conductedBy
    ? await db.user.findUnique({
        where: { id: review.conductedBy },
        select: { name: true, email: true },
      })
    : null;

  const approvedByUser = review.approvedBy
    ? await db.user.findUnique({
        where: { id: review.approvedBy },
        select: { name: true, email: true },
      })
    : null;

  // Hent alle dokumenter som skulle vært gjennomgått innen denne datoen
  const reviewDate = new Date(review.reviewDate);
  const documentsToReview = await db.document.findMany({
    where: {
      tenantId,
      nextReviewDate: {
        lte: reviewDate,
      },
    },
    orderBy: {
      nextReviewDate: "asc",
    },
  });

  return {
    ...review,
    conductedByName: conductedByUser?.name || conductedByUser?.email || "Ukjent",
    approvedByName: approvedByUser?.name || approvedByUser?.email || null,
    documentsToReview,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PLANNED":
      return <Badge variant="secondary">Planned</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-500 hover:bg-blue-500">In progress</Badge>;
    case "COMPLETED":
      return <Badge className="bg-yellow-500 hover:bg-yellow-500">Completed</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-600 hover:bg-green-600">Approved</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function ManagementReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || !session.user.tenantId) {
    return notFound();
  }

  const permissions = getPermissions(session.user.role);

  if (!permissions.canReadManagementReviews) {
    redirect("/dashboard");
  }

  const review = await getManagementReview(id, session.user.tenantId);

  if (!review) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/management-reviews">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{review.title}</h1>
            <p className="text-muted-foreground">
              {format(new Date(review.reviewDate), "dd. MMMM yyyy", { locale: enGB })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(review.status)}
          {permissions.canCreateManagementReviews && review.status !== "APPROVED" && (
            <>
              <ApproveManagementReviewButton
                reviewId={review.id}
                canApprove={review.status === "COMPLETED"}
                documentsCount={review.documentsToReview.length}
              />
              <Button asChild>
                <Link href={`/dashboard/management-reviews/${review.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rediger
                </Link>
              </Button>
            </>
          )}
          {review.status === "APPROVED" && permissions.canCreateManagementReviews && (
            <Button asChild>
              <Link href={`/dashboard/management-reviews/${review.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Rediger
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Grunnleggende informasjon */}
      <Card>
        <CardHeader>
          <CardTitle>Grunnleggende informasjon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Periode</p>
              <p className="text-lg font-semibold">{review.period}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conducted by</p>
              <p className="text-lg">{review.conductedByName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-lg">
                {format(new Date(review.createdAt), "dd. MMM yyyy HH:mm", { locale: enGB })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sist oppdatert</p>
              <p className="text-lg">
                {format(new Date(review.updatedAt), "dd. MMM yyyy HH:mm", { locale: enGB })}
              </p>
            </div>
          </div>

          {review.approvedAt && review.approvedByName && (
            <>
              <Separator />
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Approved by {review.approvedByName}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {format(new Date(review.approvedAt), "dd MMMM yyyy HH:mm", { locale: enGB })}
                  </p>
                </div>
              </div>
            </>
          )}

          {review.nextReviewDate && (
            <>
              <Separator />
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Next review planned
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {format(new Date(review.nextReviewDate), "dd. MMMM yyyy", { locale: enGB })}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dokumenter til gjennomgang */}
      {review.documentsToReview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumenter til gjennomgang
            </CardTitle>
            <CardDescription>
              {review.documentsToReview.length} document(s) that should have been reviewed by this date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {review.documentsToReview.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{doc.title}</p>
                      <Badge variant={doc.status === "APPROVED" ? "default" : "secondary"}>
                        {doc.status === "APPROVED" ? "Approved" : doc.status === "DRAFT" ? "Draft" : "Archived"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Version: {doc.version}</span>
                      <span>
                        Should have been reviewed: {format(new Date(doc.nextReviewDate!), "dd. MMM yyyy", { locale: enGB })}
                      </span>
                      {doc.status === "APPROVED" && doc.approvedAt && (
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Approved {format(new Date(doc.approvedAt), "dd. MMM yyyy", { locale: enGB })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/documents/${doc.id}`}>
                    <Button variant="ghost" size="sm">
                      Se dokument
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HMS-gjennomgang */}
      <Card>
        <CardHeader>
          <CardTitle>HMS-gjennomgang</CardTitle>
          <CardDescription>Status and results from different HSEQ areas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {review.hmsGoalsReview && (
            <div>
              <h3 className="mb-2 font-semibold">HSEQ goals and results</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.hmsGoalsReview}
              </p>
            </div>
          )}

          {review.incidentStatistics && (
            <div>
              <h3 className="mb-2 font-semibold">Incidents and events</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.incidentStatistics}
              </p>
            </div>
          )}

          {review.riskReview && (
            <div>
              <h3 className="mb-2 font-semibold">Risk assessments</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.riskReview}
              </p>
            </div>
          )}

          {review.auditResults && (
            <div>
              <h3 className="mb-2 font-semibold">Audits and inspections</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.auditResults}
              </p>
            </div>
          )}

          {review.trainingStatus && (
            <div>
              <h3 className="mb-2 font-semibold">Training and competence</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.trainingStatus}
              </p>
            </div>
          )}

          {review.resourcesReview && (
            <div>
              <h3 className="mb-2 font-semibold">Resources and budget</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.resourcesReview}
              </p>
            </div>
          )}

          {review.externalChanges && (
            <div>
              <h3 className="mb-2 font-semibold">External changes</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {review.externalChanges}
              </p>
            </div>
          )}

          {review.wellbeingSummary && (
            <div>
              <h3 className="mb-2 font-semibold">Psychosocial working environment</h3>
              <div className="whitespace-pre-wrap text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg border border-blue-200">
                {review.wellbeingSummary}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conclusions and follow-up */}
      {(review.conclusions || review.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Conclusions and follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {review.conclusions && (
              <div>
                <h3 className="mb-2 font-semibold">Conclusions</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {review.conclusions}
                </p>
              </div>
            )}

            {review.notes && (
              <div>
                <h3 className="mb-2 font-semibold">Notes</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {review.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

