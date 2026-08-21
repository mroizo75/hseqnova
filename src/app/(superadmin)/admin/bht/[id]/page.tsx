import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  ListTodo,
  MessageSquare,
  Play,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { BhtActionButtons } from "@/features/admin/components/bht-action-buttons";
import { BhtConsultationForm } from "@/features/admin/components/bht-consultation-form";
import { BhtMeasuresReview } from "@/features/admin/components/bht-measures-review";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const bhtClient = await prisma.bhtClient.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } } },
  });
  return {
    title: bhtClient ? `${bhtClient.tenant.name} - BHT | HMS Nova` : "BHT-kunde | HMS Nova",
  };
}

export default async function BhtClientPage({ params }: PageProps) {
  const { id } = await params;
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

  const currentYear = new Date().getFullYear();

  const bhtClient = await prisma.bhtClient.findUnique({
    where: { id },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          orgNumber: true,
          industry: true,
          employeeCount: true,
          contactPerson: true,
          contactEmail: true,
          contactPhone: true,
        },
      },
      assessments: {
        orderBy: { year: "desc" },
        take: 3,
      },
      consultations: {
        orderBy: { conductedAt: "desc" },
        take: 10,
      },
      amoMeetings: {
        orderBy: { year: "desc" },
        take: 3,
      },
      inspections: {
        orderBy: { year: "desc" },
        take: 3,
      },
      exposureAssessments: {
        orderBy: { year: "desc" },
        take: 3,
      },
      annualReports: {
        orderBy: { year: "desc" },
        take: 3,
      },
    },
  });

  // Hent bedriftens tiltak (Measures)
  const tenantMeasures = bhtClient ? await prisma.measure.findMany({
    where: {
      tenantId: bhtClient.tenant.id,
      createdAt: {
        gte: new Date(currentYear, 0, 1),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      responsible: {
        select: { name: true },
      },
    },
  }) : [];

  if (!bhtClient) {
    notFound();
  }

  // Finn årets leveranser
  const currentAssessment = bhtClient.assessments.find((a) => a.year === currentYear);
  const currentAmo = bhtClient.amoMeetings.find((a) => a.year === currentYear);
  const currentInspection = bhtClient.inspections.find((i) => i.year === currentYear);
  const currentExposure = bhtClient.exposureAssessments.find((e) => e.year === currentYear);
  const currentReport = bhtClient.annualReports.find((r) => r.year === currentYear);

  // Telle tiltak
  const openMeasures = tenantMeasures.filter(m => m.status === "PENDING" || m.status === "IN_PROGRESS").length;
  const completedMeasures = tenantMeasures.filter(m => m.status === "DONE").length;
  const hasMeasuresThisYear = tenantMeasures.length > 0;

  // Kvalitetssjekk
  const qualityChecks = [
    { name: "Kartlegging gjennomført", done: currentAssessment?.status === "COMPLETED" },
    { name: "Rådgivning dokumentert", done: bhtClient.consultations.some(c => c.conductedAt.getFullYear() === currentYear) },
    { name: "AMO eller vernerunde utført", done: currentAmo?.status === "COMPLETED" || currentInspection?.status === "COMPLETED" },
    { name: "Eksponeringsvurdering gjort", done: currentExposure?.status === "COMPLETED" },
    { name: "Årsrapport ferdig", done: currentReport?.status === "COMPLETED" },
    { name: "Tiltak registrert", done: currentReport?.checkActionsDone ?? hasMeasuresThisYear },
  ];

  const allCompleted = qualityChecks.every((c) => c.done);

  function getStatusBadge(status: string) {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Fullført</Badge>;
      case "AI_ANALYZED":
      case "AI_GENERATED":
        return <Badge className="bg-blue-500">AI-analysert</Badge>;
      case "SENT_TO_CUSTOMER":
        return <Badge className="bg-yellow-500">Sendt til kunde</Badge>;
      case "BHT_REVIEWED":
        return <Badge className="bg-purple-500">BHT vurdert</Badge>;
      case "DRAFT":
      case "PLANNED":
        return <Badge variant="secondary">Utkast</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/bht">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{bhtClient.tenant.name}</h1>
            <Badge className={bhtClient.status === "ACTIVE" ? "bg-green-500" : ""}>
              {bhtClient.status === "ACTIVE" ? "Aktiv" : bhtClient.status}
            </Badge>
            <Badge variant="outline">
              {bhtClient.packageType === "BASIC" ? "Grunnpakke" : "Utvidet"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {bhtClient.tenant.industry || "Ukjent bransje"} • {bhtClient.tenant.employeeCount || "?"} ansatte
          </p>
        </div>
      </div>

      {/* Kvalitetssjekk-kort */}
      <Card className={allCompleted ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" : "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {allCompleted ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-700 dark:text-green-300">Grunnpakken er levert korrekt for {currentYear}</span>
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className="text-orange-700 dark:text-orange-300">Kvalitetssjekk {currentYear}</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {qualityChecks.map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                {check.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                )}
                <span className={`text-sm ${check.done ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-400"}`}>
                  {check.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Intern formulering */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 italic">
            <strong>Påminnelse:</strong> AI benyttes som beslutningsstøtte. 
            Endelige vurderinger og anbefalinger er faglig vurdert og godkjent av bedriftshelsetjenesten.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="deliveries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deliveries">
            <ClipboardList className="h-4 w-4 mr-2" />
            Leveranser {currentYear}
          </TabsTrigger>
          <TabsTrigger value="measures">
            <ListTodo className="h-4 w-4 mr-2" />
            Tiltak ({tenantMeasures.length})
          </TabsTrigger>
          <TabsTrigger value="consultations">
            <MessageSquare className="h-4 w-4 mr-2" />
            Rådgivning
          </TabsTrigger>
          <TabsTrigger value="info">
            <Building2 className="h-4 w-4 mr-2" />
            Kundeinformasjon
          </TabsTrigger>
        </TabsList>

        {/* Leveranser-tab */}
        <TabsContent value="deliveries" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 1. Kartlegging */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    1. Arbeidsmiljøkartlegging
                  </CardTitle>
                  {currentAssessment && getStatusBadge(currentAssessment.status)}
                </div>
                <CardDescription>
                  AML § 3-1 | BHT-forskriften § 13 a
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAssessment ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      {currentAssessment.aiGeneratedAt && (
                        <span className="text-muted-foreground">
                          AI-analyse: {new Date(currentAssessment.aiGeneratedAt).toLocaleDateString("nb-NO")}
                        </span>
                      )}
                    </p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/bht/${id}/assessment/${currentYear}`}>
                        Se detaljer
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <BhtActionButtons
                    action="assessment"
                    bhtClientId={id}
                    year={currentYear}
                    label="Start kartlegging"
                  />
                )}
              </CardContent>
            </Card>

            {/* 2. AMO/Vernerunde valg */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    3. AMO / Vernerunde
                  </CardTitle>
                  {(currentAmo || currentInspection) && getStatusBadge(currentAmo?.status || currentInspection?.status || "")}
                </div>
                <CardDescription>
                  AML kap. 7 | BHT-forskriften § 13 c
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAmo || currentInspection ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {currentAmo ? "AMO-møte valgt" : "Vernerunde valgt"}
                    </p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/bht/${id}/${currentAmo ? "amo" : "inspection"}/${currentYear}`}>
                        Se detaljer
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <BhtActionButtons
                      action="amo"
                      bhtClientId={id}
                      year={currentYear}
                      label="AMO-møte"
                    />
                    <BhtActionButtons
                      action="inspection"
                      bhtClientId={id}
                      year={currentYear}
                      label="Vernerunde"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Eksponeringsvurdering */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    4. Eksponeringsvurdering
                  </CardTitle>
                  {currentExposure && getStatusBadge(currentExposure.status)}
                </div>
                <CardDescription>
                  BHT-forskriften § 13 d
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentExposure ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Risikonivå: {currentExposure.aiRiskLevel || "Ikke vurdert"}
                    </p>
                    {currentExposure.furtherActionNeeded && (
                      <p className="text-sm text-orange-600">
                        ⚠ Anbefaler videre kartlegging
                      </p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/bht/${id}/exposure/${currentYear}`}>
                        Se detaljer
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <BhtActionButtons
                    action="exposure"
                    bhtClientId={id}
                    year={currentYear}
                    label="Start vurdering"
                  />
                )}
              </CardContent>
            </Card>

            {/* 4. Årsrapport */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    5. Årsrapport & Plan
                  </CardTitle>
                  {currentReport && getStatusBadge(currentReport.status)}
                </div>
                <CardDescription>
                  BHT-forskriften § 13 e | IK-forskriften § 5
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentReport ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Generert: {currentReport.aiGeneratedAt ? new Date(currentReport.aiGeneratedAt).toLocaleDateString("nb-NO") : "Ikke generert"}
                    </p>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/admin/bht/${id}/report/${currentYear}`}>
                        Se rapport
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <BhtActionButtons
                    action="report"
                    bhtClientId={id}
                    year={currentYear}
                    label="Generer rapport"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tiltak-tab */}
        <TabsContent value="measures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Bedriftens tiltak {currentYear}
              </CardTitle>
              <CardDescription>
                Tiltak fra avvik, risikovurderinger og vernerunder - BHT gjennomgår og bekrefter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Statistikk */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{tenantMeasures.length}</p>
                  <p className="text-sm text-muted-foreground">Totalt</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{openMeasures}</p>
                  <p className="text-sm text-muted-foreground">Åpne</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{completedMeasures}</p>
                  <p className="text-sm text-muted-foreground">Fullført</p>
                </div>
              </div>

              {tenantMeasures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen tiltak registrert i {currentYear}</p>
                  <p className="text-sm mt-2">
                    Tiltak opprettes fra avvik, risikovurderinger eller vernerunder i HMS Nova
                  </p>
                </div>
              ) : (
                <BhtMeasuresReview
                  bhtClientId={id}
                  reportId={currentReport?.id || null}
                  measures={tenantMeasures.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    status: m.status,
                    dueAt: m.dueAt,
                    createdAt: m.createdAt,
                    responsible: m.responsible,
                  }))}
                  isConfirmed={currentReport?.checkActionsDone ?? false}
                />
              )}

              {/* BHT-vurdering info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>BHT-oppgave:</strong> Gå gjennom bedriftens tiltak, vurder om de er tilstrekkelige 
                  for å håndtere identifiserte risikoer, og bekreft gjennomgang. Anbefal nye tiltak ved behov.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rådgivning-tab */}
        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                2. HMS-rådgivning
              </CardTitle>
              <CardDescription>
                BHT-forskriften § 13 b - Begrenset forebyggende bistand
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BhtConsultationForm bhtClientId={id} />
            </CardContent>
          </Card>

          {/* Tidligere rådgivninger */}
          {bhtClient.consultations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rådgivningslogg</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bhtClient.consultations.map((consultation) => (
                    <div key={consultation.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{consultation.topic}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(consultation.conductedAt).toLocaleDateString("nb-NO")} • {consultation.method}
                            {consultation.durationMinutes && ` • ${consultation.durationMinutes} min`}
                          </p>
                        </div>
                        <Badge variant={consultation.isWithinScope ? "secondary" : "destructive"}>
                          {consultation.isWithinScope ? "Innenfor scope" : "Utenfor scope"}
                        </Badge>
                      </div>
                      <p className="text-sm mt-2">{consultation.description}</p>
                      <div className="mt-2 p-2 bg-muted rounded">
                        <p className="text-sm"><strong>Anbefaling:</strong> {consultation.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Info-tab */}
        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kundeinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Bedriftsnavn</p>
                  <p className="font-medium">{bhtClient.tenant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Org.nr</p>
                  <p className="font-medium">{bhtClient.tenant.orgNumber || "Ikke angitt"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bransje</p>
                  <p className="font-medium">{bhtClient.tenant.industry || "Ikke angitt"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Antall ansatte</p>
                  <p className="font-medium">{bhtClient.tenant.employeeCount || "Ikke angitt"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontaktperson</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Navn</p>
                  <p className="font-medium">{bhtClient.tenant.contactPerson || "Ikke angitt"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-post</p>
                  <p className="font-medium">{bhtClient.tenant.contactEmail || "Ikke angitt"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{bhtClient.tenant.contactPhone || "Ikke angitt"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avtaledetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Pakketype</p>
                  <p className="font-medium">
                    {bhtClient.packageType === "BASIC" ? "Grunnpakke BHT" : "Utvidet BHT-pakke"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avtalestart</p>
                  <p className="font-medium">
                    {new Date(bhtClient.contractStartDate).toLocaleDateString("nb-NO")}
                  </p>
                </div>
                {bhtClient.contractEndDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Avtaleslutt</p>
                    <p className="font-medium">
                      {new Date(bhtClient.contractEndDate).toLocaleDateString("nb-NO")}
                    </p>
                  </div>
                )}
                {bhtClient.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notater</p>
                    <p className="font-medium">{bhtClient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

