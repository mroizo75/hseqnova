import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCoshhAssessment } from "@/server/actions/coshh.actions";
import { loadChemicalById } from "@/server/queries/chemicals.queries";
import { CoshhLegalNote } from "@/features/chemicals/components/coshh-legal-note";

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CoshhAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const assessment = await getCoshhAssessment(id);
  if (!assessment) {
    notFound();
  }

  const chemical = assessment.chemicalId
    ? await loadChemicalById(assessment.chemicalId, session.user.tenantId)
    : null;
  const overdue = Boolean(
    assessment.reviewDueAt && new Date(assessment.reviewDueAt) < new Date(),
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard/coshh-assessments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to COSHH assessments
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">COSHH assessment</h1>
        <p className="text-sm text-muted-foreground">
          Significant findings (COSHH 2002 reg.6). Not sent to the HSE.
        </p>
      </div>

      <CoshhLegalNote />

      <Card>
        <CardHeader>
          <CardTitle>Substance and task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Substance: </span>
            {chemical ? (
              <Link
                href={`/dashboard/chemicals/${chemical.id}`}
                className="font-medium hover:underline"
              >
                {chemical.productName}
              </Link>
            ) : (
              "Not linked"
            )}
          </p>
          <p className="whitespace-pre-wrap">{assessment.taskDescription}</p>
          {assessment.exposureRoutes && (
            <div>
              <p className="font-medium mb-1">How people may be exposed</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {assessment.exposureRoutes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controls (reg.7)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Existing controls</p>
            <p className="whitespace-pre-wrap">
              {assessment.existingControls || "—"}
            </p>
          </div>
          {assessment.additionalControls && (
            <div>
              <p className="font-medium mb-1">Further controls needed</p>
              <p className="whitespace-pre-wrap">{assessment.additionalControls}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review and health surveillance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-center">
          <Badge variant={assessment.healthSurveillance ? "destructive" : "secondary"}>
            {assessment.healthSurveillance
              ? "Health surveillance required"
              : "Health surveillance not required"}
          </Badge>
          <span className={overdue ? "text-sm text-red-600 font-medium" : "text-sm text-muted-foreground"}>
            Review due {formatDate(assessment.reviewDueAt)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
