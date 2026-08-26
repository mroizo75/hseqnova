import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSjaStatusLabel,
  getSjaStatusColor,
  getSjaConclusionLabel,
  getSjaConclusionColor,
  getRiskColor,
  getRiskLabel,
} from "@/features/sja/schemas/sja.schema";
import { SjaStatusActions } from "@/components/sja/sja-status-actions";
import {
  ArrowLeft,
  User,
  MapPin,
  Clock,
  HardHat,
  AlertTriangle,
  CheckCircle,
  Users,
  BookTemplate,
  CloudSun,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { loadSjaById } from "@/server/queries/sja.queries";
import { loadRamsBriefings } from "@/server/queries/rams-briefing.queries";
import { RamsBriefingPanel } from "@/features/rams-briefing/components/rams-briefing-panel";
import { buildRamsBriefingSnapshot } from "@/features/rams-briefing/lib/rams-briefing-snapshot";

export default async function SjaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const analysis = await loadSjaById(id, session.user.tenantId);
  if (!analysis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">RAMS not found</h2>
        <Link href="/dashboard/sja" className="text-primary hover:underline mt-4 block">
          Back to overview
        </Link>
      </div>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
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

  let briefings: Awaited<ReturnType<typeof loadRamsBriefings>> = [];
  try {
    briefings = await loadRamsBriefings(analysis.id, session.user.tenantId);
  } catch {
    briefings = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/sja" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{analysis.title}</h1>
            {analysis.sjaNummer && (
              <p className="text-sm text-muted-foreground font-mono">{analysis.sjaNummer}</p>
            )}
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
        {analysis.templateName && (
          <Badge variant="secondary" className="text-xs">
            <BookTemplate className="h-3 w-3 mr-1" />
            From template: {analysis.templateName}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {analysis.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardHat className="h-5 w-5" />
                  Method statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{analysis.description}</p>
              </CardContent>
            </Card>
          )}

          {(analysis.additionalConditions || analysis.weatherConditions) && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <ShieldAlert className="h-5 w-5" />
                  Site conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.weatherConditions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                      <CloudSun className="h-4 w-4" /> Weather
                    </p>
                    <p className="text-sm">{analysis.weatherConditions}</p>
                  </div>
                )}
                {analysis.additionalConditions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Changes on the day
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{analysis.additionalConditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                      {hazard.consequence && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Consequence</p>
                          <p className="text-sm">{hazard.consequence}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Likelihood</p>
                        <p className="text-sm font-medium">{hazard.probability} / 5</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Severity</p>
                        <p className="text-sm font-medium">{hazard.severity} / 5</p>
                      </div>
                      {hazard.responsibleName && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Person responsible</p>
                          <p className="text-sm font-medium">{hazard.responsibleName}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Control measures</p>
                      <p className="text-sm whitespace-pre-wrap bg-green-50 p-2 rounded border border-green-200">
                        {hazard.measures}
                      </p>
                    </div>

                    {hazard.completed && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Controls in place
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {analysis.status === "ACTIVE" || briefings.length > 0 ? (
            <RamsBriefingPanel
              sjaAnalysisId={analysis.id}
              canRecord={analysis.status === "ACTIVE"}
              previewHazards={buildRamsBriefingSnapshot(analysis.hazards)}
              briefings={briefings}
            />
          ) : null}

          {analysis.attachments && analysis.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos ({analysis.attachments.filter((item) => item.mime.startsWith("image/")).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {analysis.attachments
                    .filter((item) => item.mime.startsWith("image/"))
                    .map((img) => (
                      <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={`/api/files/${img.fileKey}`}
                          alt={img.name}
                          fill
                          className="object-cover"
                        />
                        <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {img.name}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.conclusionComment && (
            <Card>
              <CardHeader>
                <CardTitle>Approval notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{analysis.conclusionComment}</p>
              </CardContent>
            </Card>
          )}
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

              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created by</p>
                  <p className="font-medium">{analysis.createdByName}</p>
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

              <div className="text-sm">
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(analysis.createdAt)}</p>
              </div>

              {analysis.approvedAt && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Approved</p>
                  <p className="font-medium">{formatDate(analysis.approvedAt)}</p>
                  {analysis.approvedByName && (
                    <p className="text-xs text-muted-foreground">by {analysis.approvedByName}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <SjaStatusActions
            analysisId={analysis.id}
            currentStatus={analysis.status}
            currentConclusion={analysis.conclusion}
          />
        </div>
      </div>
    </div>
  );
}
