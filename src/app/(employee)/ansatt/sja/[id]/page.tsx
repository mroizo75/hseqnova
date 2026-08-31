import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getSjaStatusLabel,
  getSjaStatusColor,
  getSjaConclusionLabel,
  getSjaConclusionColor,
  getRiskColor,
  getRiskLabel,
} from "@/features/sja/schemas/sja.schema";
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  HardHat,
  AlertTriangle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { loadSjaById } from "@/server/queries/sja.queries";

export const dynamic = "force-dynamic";

export default async function EmployeeRamsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    redirect("/login");
  }

  const analysis = await loadSjaById(id, session.user.tenantId, {
    createdById: session.user.id,
  });
  if (!analysis) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const maxRisk =
    analysis.hazards.length > 0 ? Math.max(...analysis.hazards.map((hazard) => hazard.riskLevel)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/ansatt/sja">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to my RAMS
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{analysis.title}</h1>
            {analysis.sjaNummer && (
              <p className="text-sm text-muted-foreground font-mono">{analysis.sjaNummer}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Your copy of this RAMS (MHSWR 1999 reg.10). It is not sent to the HSE.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={getSjaStatusColor(analysis.status)}>
          {getSjaStatusLabel(analysis.status)}
        </Badge>
        <Badge variant="outline" className={getSjaConclusionColor(analysis.conclusion)}>
          {getSjaConclusionLabel(analysis.conclusion)}
        </Badge>
        {maxRisk >= 10 && <Badge variant="destructive">High risk (max {maxRisk})</Badge>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Method of work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {analysis.description || "No method of work recorded."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Hazards and control measures ({analysis.hazards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.hazards.map((hazard, index) => (
                  <div key={hazard.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                        <Badge variant="secondary">{hazard.activity}</Badge>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getRiskColor(hazard.riskLevel)}`}
                      >
                        Risk: {hazard.riskLevel} – {getRiskLabel(hazard.riskLevel)}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Hazard</p>
                        <p className="text-sm">{hazard.hazard}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Who might be harmed / how
                        </p>
                        <p className="text-sm">{hazard.consequence || "Not recorded"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Control measures</p>
                      <p className="text-sm whitespace-pre-wrap bg-green-50 p-2 rounded border border-green-200">
                        {hazard.measures}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Planned date</p>
                  <p className="font-medium">{formatDate(analysis.plannedDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Work location</p>
                  <p className="font-medium">{analysis.workLocation}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Competent person</p>
                  <p className="font-medium">{analysis.responsibleName}</p>
                </div>
              </div>

              {analysis.participants && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Workers involved</p>
                    <p className="font-medium whitespace-pre-wrap">{analysis.participants}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
