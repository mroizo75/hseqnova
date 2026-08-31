import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { loadPersonById, loadTrainingById } from "@/server/queries/training.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrainingEvaluationForm } from "@/features/training/components/training-evaluation-form";
import {
  getTrainingStatus,
  getTrainingStatusLabel,
  getTrainingStatusColor,
} from "@/features/training/schemas/training.schema";
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { CertificateDownloadButton } from "@/features/training/components/certificate-download-button";
import { mhswrReasonLabel } from "@/lib/training-uk";

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId || !session.user.id) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const training = await loadTrainingById({ id, tenantId });

  if (!training) {
    return <div>Training not found</div>;
  }

  const trainedUser = await loadPersonById(training.userId);

  const status = getTrainingStatus(training);
  const statusLabel = getTrainingStatusLabel(status);
  const statusColor = getTrainingStatusColor(status);

  const daysUntilExpiry = training.validUntil
    ? Math.ceil((new Date(training.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/training">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to training
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{training.title}</h1>
            <p className="text-muted-foreground">Training details</p>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
      </div>

      {/* Warning if expiring or expired */}
      {(status === "EXPIRING_SOON" || status === "EXPIRED") && (
        <Card className={status === "EXPIRED" ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"}>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className={status === "EXPIRED" ? "h-5 w-5 text-red-600" : "h-5 w-5 text-yellow-600"} />
            <div>
              <p className={`font-semibold ${status === "EXPIRED" ? "text-red-900" : "text-yellow-900"}`}>
                {status === "EXPIRED" ? "⚠️ Training has expired" : "⏰ Training expires soon"}
              </p>
              <p className={status === "EXPIRED" ? "text-red-800" : "text-yellow-800"}>
                {status === "EXPIRED"
                  ? "This training must be renewed as soon as possible."
                  : `Training expires in ${daysUntilExpiry} days. Plan a renewal.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Course information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Provider</p>
                <p className="font-medium">{training.provider}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee</p>
                <p className="font-medium">{trainedUser?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{trainedUser?.email}</p>
              </div>
            </div>

            {training.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{training.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Why this training was given</p>
              <p className="text-sm">{mhswrReasonLabel(training.mhswrReason)}</p>
            </div>

            <div className="flex items-center gap-2">
              {training.isRequired && (
                <Badge variant="destructive">Required course</Badge>
              )}
              {!training.isRequired && (
                <Badge variant="outline">Optional course</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Dates and validity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed date</p>
                <p className="font-medium">
                  {training.completedAt
                    ? new Date(training.completedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Not completed yet"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid until</p>
                <p className="font-medium">
                  {training.validUntil ? (
                    <>
                      {new Date(training.validUntil).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({daysUntilExpiry} days remaining)
                        </span>
                      )}
                    </>
                  ) : (
                    "Does not expire"
                  )}
                </p>
              </div>
            </div>

            {training.proofDocKey && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documented evidence</p>
                  <CertificateDownloadButton trainingId={training.id} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Effectiveness Evaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Training review
          </CardTitle>
          <CardDescription>
            Record whether the training delivered the intended competence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {training.effectiveness ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Training has been reviewed
                </p>
                <p className="text-sm text-green-800 whitespace-pre-wrap">
                  {training.effectiveness}
                </p>
              </div>
              {training.evaluatedAt && (
                <p className="text-sm text-muted-foreground">
                  Reviewed {new Date(training.evaluatedAt).toLocaleDateString("en-GB")}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This training has not been reviewed yet.
              </p>
              <TrainingEvaluationForm
                trainingId={training.id}
                trainingTitle={training.title}
                userId={session.user.id}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

