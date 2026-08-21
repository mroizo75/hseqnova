import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";
import { BhtAssessmentActions } from "@/features/admin/components/bht-assessment-actions";

interface PageProps {
  params: Promise<{ id: string; year: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year } = await params;
  return {
    title: `Kartlegging ${year} | BHT | HMS Nova`,
  };
}

export default async function BhtAssessmentPage({ params }: PageProps) {
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
        select: { name: true, industry: true, employeeCount: true },
      },
      assessments: {
        where: { year: yearNum },
      },
    },
  });

  if (!bhtClient) {
    notFound();
  }

  const assessment = bhtClient.assessments[0];

  if (!assessment) {
    notFound();
  }

  // Parse AI-data
  const suggestedRisks = assessment.aiSuggestedRisks
    ? JSON.parse(assessment.aiSuggestedRisks)
    : [];
  const suggestedIssues = assessment.aiSuggestedIssues
    ? JSON.parse(assessment.aiSuggestedIssues)
    : [];
  const suggestedActions = assessment.aiSuggestedActions
    ? JSON.parse(assessment.aiSuggestedActions)
    : [];

  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Fullført</Badge>;
      case "AI_ANALYZED":
        return <Badge className="bg-blue-500">AI-analysert</Badge>;
      case "SENT_TO_CUSTOMER":
        return <Badge className="bg-yellow-500">Sendt til kunde</Badge>;
      case "CUSTOMER_RESPONDED":
        return <Badge className="bg-purple-500">Kunde svart</Badge>;
      case "BHT_REVIEWED":
        return <Badge className="bg-indigo-500">BHT vurdert</Badge>;
      default:
        return <Badge variant="secondary">Utkast</Badge>;
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity?.toUpperCase()) {
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
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Arbeidsmiljøkartlegging {yearNum}</h1>
            {getStatusBadge(assessment.status)}
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
            <strong>📚 Hjemmel:</strong> AML § 3-1 | BHT-forskriften § 13 a
          </p>
        </CardContent>
      </Card>

      {/* Status-tidslinje */}
      <Card>
        <CardHeader>
          <CardTitle>Status og fremdrift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${assessment.aiGeneratedAt ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">AI-analyse</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded">
              <div
                className="h-1 bg-green-500 rounded"
                style={{
                  width:
                    assessment.status === "COMPLETED"
                      ? "100%"
                      : assessment.status === "BHT_REVIEWED"
                      ? "80%"
                      : assessment.status === "CUSTOMER_RESPONDED"
                      ? "60%"
                      : assessment.status === "SENT_TO_CUSTOMER"
                      ? "40%"
                      : "20%",
                }}
              />
            </div>
            <div className={`flex items-center gap-2 ${assessment.completedAt ? "text-green-600" : "text-gray-400"}`}>
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Fullført</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">AI-analyse</p>
              <p className="font-medium">
                {assessment.aiGeneratedAt
                  ? new Date(assessment.aiGeneratedAt).toLocaleDateString("nb-NO")
                  : "Ikke kjørt"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Sendt til kunde</p>
              <p className="font-medium">
                {assessment.sentToCustomerAt
                  ? new Date(assessment.sentToCustomerAt).toLocaleDateString("nb-NO")
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">BHT vurdert</p>
              <p className="font-medium">
                {assessment.bhtReviewedAt
                  ? new Date(assessment.bhtReviewedAt).toLocaleDateString("nb-NO")
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Fullført</p>
              <p className="font-medium">
                {assessment.completedAt
                  ? new Date(assessment.completedAt).toLocaleDateString("nb-NO")
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-foreslåtte risikoer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            AI-foreslåtte risikoer
          </CardTitle>
          <CardDescription>
            Typiske arbeidsmiljørisikoer identifisert for denne bransjen og bedriften
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestedRisks.length > 0 ? (
            <div className="space-y-3">
              {suggestedRisks.map((risk: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 border rounded-lg ${getSeverityColor(risk.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{risk.risk}</p>
                      <p className="text-sm mt-1 opacity-80">
                        Kategori: {risk.category}
                      </p>
                    </div>
                    <Badge variant="outline">{risk.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Ingen risikoer identifisert ennå</p>
          )}
        </CardContent>
      </Card>

      {/* AI-foreslåtte avvik/problemer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Mulige avvik å undersøke
          </CardTitle>
          <CardDescription>
            Problemer som bør undersøkes nærmere
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestedIssues.length > 0 ? (
            <div className="space-y-3">
              {suggestedIssues.map((issue: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 border rounded-lg ${getSeverityColor(issue.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-medium">{issue.issue}</p>
                    <Badge variant="outline">{issue.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Ingen spesifikke avvik identifisert</p>
          )}
        </CardContent>
      </Card>

      {/* AI-foreslåtte tiltak */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-500" />
            Anbefalte tiltak
          </CardTitle>
          <CardDescription>
            Forebyggende tiltak som anbefales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestedActions.length > 0 ? (
            <div className="space-y-3">
              {suggestedActions.map((action: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-green-800">{action.action}</p>
                    <Badge variant="outline" className="text-green-600">
                      {action.timeline}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Ingen tiltak foreslått ennå</p>
          )}
        </CardContent>
      </Card>

      {/* Kundens kommentarer */}
      {assessment.customerComments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kundens tilbakemelding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p>{assessment.customerComments}</p>
            </div>
            {assessment.customerAdditions && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Tillegg fra kunde:</p>
                <p>{assessment.customerAdditions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* BHT-kommentarer */}
      {assessment.bhtComments && (
        <Card>
          <CardHeader>
            <CardTitle>BHT-vurdering</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p>{assessment.bhtComments}</p>
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
          <BhtAssessmentActions
            assessmentId={assessment.id}
            bhtClientId={id}
            currentStatus={assessment.status}
          />
        </CardContent>
      </Card>
    </div>
  );
}

