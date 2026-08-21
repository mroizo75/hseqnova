import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BhtExposureActions } from "@/features/admin/components/bht-exposure-actions";

interface PageProps {
  params: Promise<{ id: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return {
    title: `Eksponeringsvurdering ${year} | BHT | HMS Nova`,
  };
}

export default async function BhtExposurePage({ params }: PageProps) {
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
      exposureAssessments: {
        where: { year: yearNum },
      },
    },
  });

  if (!bhtClient || !bhtClient.exposureAssessments[0]) {
    notFound();
  }

  const exposure = bhtClient.exposureAssessments[0];

  // Parse AI-data
  const exposureAnalysis = exposure.aiExposureAnalysis
    ? JSON.parse(exposure.aiExposureAnalysis)
    : [];
  const chemicals = exposure.chemicalInventory
    ? JSON.parse(exposure.chemicalInventory)
    : [];

  function getRiskColor(level: string) {
    switch (level?.toUpperCase()) {
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "LOW":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }

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
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Eksponeringsvurdering {yearNum}</h1>
            <Badge className={exposure.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}>
              {exposure.status === "COMPLETED" ? "Fullført" : exposure.status}
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
            <strong>📚 Hjemmel:</strong> BHT-forskriften § 13 d
          </p>
        </CardContent>
      </Card>

      {/* Overordnet risikonivå */}
      <Card className={getRiskColor(exposure.aiRiskLevel || "")}>
        <CardHeader>
          <CardTitle>Overordnet risikonivå</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              {exposure.aiRiskLevel || "Ikke vurdert"}
            </div>
            {exposure.furtherActionNeeded && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Anbefaler videre kartlegging</span>
              </div>
            )}
          </div>
          {exposure.conclusion && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="font-medium">
                BHT-konklusjon: {exposure.conclusion === "SUFFICIENT" 
                  ? "✔ Tilstrekkelig vurdert" 
                  : "⚠ Anbefaler videre kartlegging"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stoffkartotek */}
      {chemicals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stoffkartotek ({chemicals.length} stoffer)</CardTitle>
            <CardDescription>Kjemikalier registrert i bedriften</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {chemicals.slice(0, 10).map((chem: any, i: number) => (
                <div key={i} className="p-2 border rounded flex items-center justify-between">
                  <span>{chem.productName || chem.name || `Stoff ${i + 1}`}</span>
                </div>
              ))}
              {chemicals.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  ... og {chemicals.length - 10} flere
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-eksponeringanalyse */}
      <Card>
        <CardHeader>
          <CardTitle>AI-eksponeringanalyse</CardTitle>
          <CardDescription>
            Automatisk vurdering av mulig eksponering basert på bransje og data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exposureAnalysis.length > 0 ? (
            <div className="space-y-3">
              {exposureAnalysis.map((exp: any, i: number) => (
                <div key={i} className={`p-4 border rounded-lg ${getRiskColor(exp.riskLevel)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{exp.type}</p>
                      <p className="text-sm mt-1">{exp.description}</p>
                      {exp.recommendation && (
                        <p className="text-sm mt-2 font-medium">
                          💡 {exp.recommendation}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{exp.riskLevel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Ingen eksponeringsvurdering tilgjengelig</p>
          )}
        </CardContent>
      </Card>

      {/* BHT-notater */}
      {exposure.assessmentNotes && (
        <Card>
          <CardHeader>
            <CardTitle>BHT-vurdering</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{exposure.assessmentNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Videre tiltak */}
      {exposure.furtherActionNotes && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Anbefalte videre tiltak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800">{exposure.furtherActionNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Handlinger */}
      <Card>
        <CardHeader>
          <CardTitle>Handlinger</CardTitle>
        </CardHeader>
        <CardContent>
          <BhtExposureActions
            exposureId={exposure.id}
            bhtClientId={id}
            currentStatus={exposure.status}
            currentConclusion={exposure.conclusion}
          />
        </CardContent>
      </Card>
    </div>
  );
}

