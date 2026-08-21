import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardCheck, Calendar, AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BhtInspectionActions } from "@/features/admin/components/bht-inspection-actions";

interface PageProps {
  params: Promise<{ id: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return {
    title: `Vernerunde ${year} | BHT | HMS Nova`,
  };
}

export default async function BhtInspectionPage({ params }: PageProps) {
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
      inspections: {
        where: { year: yearNum },
      },
    },
  });

  if (!bhtClient || !bhtClient.inspections[0]) {
    notFound();
  }

  const inspection = bhtClient.inspections[0];

  // Parse data
  const checklist = inspection.aiGeneratedChecklist
    ? JSON.parse(inspection.aiGeneratedChecklist)
    : [];
  const findings = inspection.findings
    ? JSON.parse(inspection.findings)
    : [];
  const improvements = inspection.improvements
    ? JSON.parse(inspection.improvements)
    : [];

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
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">BHT-Vernerunde {yearNum}</h1>
            <Badge className={inspection.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"}>
              {inspection.status}
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
            <strong>📚 Hjemmel:</strong> AML § 6-2 | IK-forskriften § 5
          </p>
        </CardContent>
      </Card>

      {/* Inspeksjonsdato */}
      {inspection.inspectionDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dato for vernerunde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {new Date(inspection.inspectionDate).toLocaleDateString("nb-NO", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-muted-foreground">
              Type: {inspection.inspectionType === "DIGITAL" ? "Digital vernerunde" : inspection.inspectionType === "IN_PERSON" ? "Fysisk vernerunde" : "Hybrid"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI-generert sjekkliste */}
      {checklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI-generert sjekkliste</CardTitle>
            <CardDescription>
              Sjekkpunkter basert på bransje: {inspection.basedOnIndustry || "Generell"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklist.map((item: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="h-5 w-5 rounded border-2 border-gray-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.item}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <Badge variant="outline" className="mt-1">{item.category}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funn/avvik */}
      {findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Registrerte funn og avvik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {findings.map((finding: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                  <p className="font-medium text-orange-800">
                    {typeof finding === "string" ? finding : finding.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forbedringsforslag */}
      {improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-500" />
              Forbedringsforslag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {improvements.map((imp: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <p className="font-medium text-green-800">
                    {typeof imp === "string" ? imp : imp.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tiltak registrert */}
      {inspection.actionsRegistered && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span>Tiltak er registrert i HMS Nova</span>
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
          <BhtInspectionActions
            inspectionId={inspection.id}
            bhtClientId={id}
            currentStatus={inspection.status}
          />
        </CardContent>
      </Card>
    </div>
  );
}

