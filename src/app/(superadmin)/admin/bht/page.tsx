import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "BHT-administrasjon | HMS Nova",
  description: "Administrer bedriftshelsetjeneste-kunder",
};

export default async function BhtAdminPage() {
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

  // Hent alle BHT-kunder med relatert data
  const bhtClients = await prisma.bhtClient.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          industry: true,
          employeeCount: true,
          contactPerson: true,
          contactEmail: true,
        },
      },
      assessments: {
        where: { year: new Date().getFullYear() },
        take: 1,
      },
      consultations: {
        where: {
          conductedAt: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
      amoMeetings: {
        where: { year: new Date().getFullYear() },
        take: 1,
      },
      inspections: {
        where: { year: new Date().getFullYear() },
        take: 1,
      },
      exposureAssessments: {
        where: { year: new Date().getFullYear() },
        take: 1,
      },
      annualReports: {
        where: { year: new Date().getFullYear() },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Statistikk
  const currentYear = new Date().getFullYear();
  const activeClients = bhtClients.filter((c) => c.status === "ACTIVE").length;
  const completedAssessments = bhtClients.filter(
    (c) => c.assessments[0]?.status === "COMPLETED"
  ).length;
  const completedReports = bhtClients.filter(
    (c) => c.annualReports[0]?.status === "COMPLETED"
  ).length;

  // Kunder som mangler leveranser i år
  const clientsNeedingAction = bhtClients.filter((c) => {
    if (c.status !== "ACTIVE") return false;
    const hasAssessment = c.assessments[0]?.status === "COMPLETED";
    const hasAmoOrInspection =
      c.amoMeetings[0]?.status === "COMPLETED" ||
      c.inspections[0]?.status === "COMPLETED";
    const hasExposure = c.exposureAssessments[0]?.status === "COMPLETED";
    const hasReport = c.annualReports[0]?.status === "COMPLETED";
    return !hasAssessment || !hasAmoOrInspection || !hasExposure || !hasReport;
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Aktiv</Badge>;
      case "PAUSED":
        return <Badge variant="secondary">Pauset</Badge>;
      case "TERMINATED":
        return <Badge variant="destructive">Avsluttet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getDeliveryStatus(client: (typeof bhtClients)[0]) {
    const items = [
      { name: "Kartlegging", done: client.assessments[0]?.status === "COMPLETED" },
      {
        name: "AMO/Vernerunde",
        done:
          client.amoMeetings[0]?.status === "COMPLETED" ||
          client.inspections[0]?.status === "COMPLETED",
      },
      { name: "Eksponering", done: client.exposureAssessments[0]?.status === "COMPLETED" },
      { name: "Årsrapport", done: client.annualReports[0]?.status === "COMPLETED" },
    ];
    const completed = items.filter((i) => i.done).length;
    return { items, completed, total: items.length };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            BHT-administrasjon
          </h1>
          <p className="text-muted-foreground mt-1">
            Administrer bedriftshelsetjeneste-kunder og leveranser
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/bht/new">
            <Plus className="h-4 w-4 mr-2" />
            Ny BHT-kunde
          </Link>
        </Button>
      </div>

      {/* Statistikk-kort */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive kunder</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              av {bhtClients.length} totalt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kartlegginger {currentYear}</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssessments}</div>
            <p className="text-xs text-muted-foreground">
              av {activeClients} fullført
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Årsrapporter {currentYear}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReports}</div>
            <p className="text-xs text-muted-foreground">
              av {activeClients} fullført
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trenger oppfølging</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {clientsNeedingAction.length}
            </div>
            <p className="text-xs text-muted-foreground">
              kunder mangler leveranser
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intern formulering */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 italic">
            <strong>Fast intern formulering:</strong> AI benyttes som beslutningsstøtte. 
            Endelige vurderinger og anbefalinger er faglig vurdert og godkjent av bedriftshelsetjenesten.
          </p>
        </CardContent>
      </Card>

      {/* Kunder som trenger oppfølging */}
      {clientsNeedingAction.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Calendar className="h-5 w-5" />
              Kunder som trenger oppfølging i {currentYear}
            </CardTitle>
            <CardDescription>
              Disse kundene har ikke fullført alle leveranser for grunnpakken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientsNeedingAction.slice(0, 5).map((client) => {
                const delivery = getDeliveryStatus(client);
                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{client.tenant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.tenant.industry || "Ukjent bransje"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {delivery.items.map((item, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              item.done ? "bg-green-500" : "bg-gray-300"
                            }`}
                            title={`${item.name}: ${item.done ? "Fullført" : "Mangler"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {delivery.completed}/{delivery.total}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/bht/${client.id}`}>Åpne</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alle BHT-kunder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alle BHT-kunder
          </CardTitle>
          <CardDescription>
            Oversikt over alle kunder med BHT-avtale
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bhtClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen BHT-kunder registrert ennå</p>
              <Button className="mt-4" asChild>
                <Link href="/admin/bht/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Legg til første kunde
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bhtClients.map((client) => {
                const delivery = getDeliveryStatus(client);
                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{client.tenant.name}</p>
                          {getStatusBadge(client.status)}
                          <Badge variant="outline">
                            {client.packageType === "BASIC" ? "Grunnpakke" : "Utvidet"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{client.tenant.industry || "Ukjent bransje"}</span>
                          {client.tenant.employeeCount && (
                            <span>{client.tenant.employeeCount} ansatte</span>
                          )}
                          <span>Avtale: {new Date(client.contractStartDate).toLocaleDateString("nb-NO")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {/* Leveransestatus */}
                      <div className="hidden md:flex items-center gap-2">
                        {delivery.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-1" title={item.name}>
                            {item.done ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Rådgivninger i år */}
                      <div className="text-center">
                        <p className="text-lg font-bold">{client.consultations.length}</p>
                        <p className="text-xs text-muted-foreground">rådgivninger</p>
                      </div>

                      <Button variant="outline" asChild>
                        <Link href={`/admin/bht/${client.id}`}>Administrer</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

