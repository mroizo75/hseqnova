import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Calendar,
  Lightbulb,
  Target,
} from "lucide-react";
import Link from "next/link";
import { BhtReportActions } from "@/features/admin/components/bht-report-actions";

interface PageProps {
  params: Promise<{ id: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return {
    title: `Årsrapport ${year} | BHT | HMS Nova`,
  };
}

export default async function BhtReportPage({ params }: PageProps) {
  const { id, year } = await params;
  const yearNum = parseInt(year);

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user?.isSuperAdmin && !user?.isSupport) {
    redirect("/dashboard");
  }

  const bhtClient = await prisma.bhtClient.findUnique({
    where: { id },
    include: {
      tenant: {
        select: { name: true, industry: true },
      },
      annualReports: {
        where: { year: yearNum },
      },
    },
  });

  if (!bhtClient || !bhtClient.annualReports[0]) {
    notFound();
  }

  const report = bhtClient.annualReports[0];

  // Parse AI-data
  const suggestedActions = report.aiSuggestedActions
    ? JSON.parse(report.aiSuggestedActions)
    : [];
  const nextYearPlan = report.aiNextYearPlan
    ? JSON.parse(report.aiNextYearPlan)
    : [];

  // Kvalitetssjekk-liste
  const qualityChecks = [
    { name: "Kartlegging gjennomført", done: report.checkAssessmentDone },
    { name: "Rådgivning dokumentert", done: report.checkConsultationsDone },
    { name: "AMO eller vernerunde utført", done: report.checkAmoOrInspectionDone },
    { name: "Eksponeringsvurdering gjort", done: report.checkExposureDone },
    { name: "Årsrapport ferdig", done: report.checkReportDone },
    { name: "Tiltak registrert", done: report.checkActionsDone },
  ];

  const allCompleted = qualityChecks.every((c) => c.done);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/bht/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">BHT Årsrapport {yearNum}</h1>
            <Badge className={report.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}>
              {report.status === "COMPLETED" ? "Fullført" : report.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {bhtClient.tenant.name} • {bhtClient.tenant.industry || "Ukjent bransje"}
          </p>
        </div>
      </div>

      {/* Hjemmel */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>📚 Hjemmel:</strong> BHT-forskriften § 13 e | IK-forskriften § 5
          </p>
        </CardContent>
      </Card>

      {/* Kvalitetssjekk */}
      <Card className={allCompleted ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Calendar className="h-5 w-5 text-orange-600" />
            )}
            Intern kvalitetssjekk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {qualityChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                )}
                <span className={`text-sm ${check.done ? "text-green-700" : "text-gray-600"}`}>
                  {check.name}
                </span>
              </div>
            ))}
          </div>
          {allCompleted && (
            <p className="mt-4 text-green-700 font-medium">
              ✅ Grunnpakken er levert korrekt for {yearNum}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sammendrag */}
      <Card>
        <CardHeader>
          <CardTitle>Sammendrag av aktiviteter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.assessmentSummary && (
            <div>
              <p className="text-sm text-muted-foreground">Kartlegging</p>
              <p>{report.assessmentSummary}</p>
            </div>
          )}
          {report.consultationsSummary && (
            <div>
              <p className="text-sm text-muted-foreground">Rådgivning</p>
              <p>{report.consultationsSummary}</p>
            </div>
          )}
          {report.amoOrInspectionSummary && (
            <div>
              <p className="text-sm text-muted-foreground">AMO/Vernerunde</p>
              <p>{report.amoOrInspectionSummary}</p>
            </div>
          )}
          {report.exposureSummary && (
            <div>
              <p className="text-sm text-muted-foreground">Eksponeringsvurdering</p>
              <p>{report.exposureSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-generert rapport */}
      {report.aiDraftReport && (
        <Card>
          <CardHeader>
            <CardTitle>AI-generert rapportutkast</CardTitle>
            <CardDescription>
              Automatisk generert sammendrag - bør kvalitetssikres av BHT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
              {report.aiDraftReport}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anbefalte tiltak */}
      {suggestedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Anbefalte tiltak for neste år
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestedActions.map((action: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg flex items-start justify-between">
                  <div>
                    <p className="font-medium">{action.action}</p>
                    <p className="text-sm text-muted-foreground">
                      Tidslinje: {action.timeline}
                    </p>
                  </div>
                  <Badge variant={action.priority === "HIGH" ? "destructive" : "secondary"}>
                    {action.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan for neste år */}
      {nextYearPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Plan for {yearNum + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextYearPlan.map((item: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.activity}</p>
                    <p className="text-sm text-muted-foreground">
                      Ansvarlig: {item.responsible}
                    </p>
                  </div>
                  <Badge variant="outline">{item.quarter}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BHT-justeringer */}
      {report.bhtAdjustments && (
        <Card>
          <CardHeader>
            <CardTitle>BHT-justeringer</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{report.bhtAdjustments}</p>
          </CardContent>
        </Card>
      )}

      {/* Ledelsens gjennomgang */}
      {report.managementReviewedAt && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span>
                Ledelsens gjennomgang fullført:{" "}
                {new Date(report.managementReviewedAt).toLocaleDateString("nb-NO")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Handlinger */}
      <Card>
        <CardHeader>
          <CardTitle>Handlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <BhtReportActions
            reportId={report.id}
            bhtClientId={id}
            currentStatus={report.status}
            hasManagementReview={!!report.managementReviewedAt}
          />
        </CardContent>
      </Card>
    </div>
  );
}

