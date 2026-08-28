import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, Flame, Pencil, Clock } from "lucide-react";
import Link from "next/link";
import { getFireRiskAssessment } from "@/server/actions/fire-risk.actions";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

function riskBadge(level: string | null) {
  if (!level) return <Badge variant="outline">Not assessed</Badge>;
  switch (level) {
    case "HIGH":
      return <Badge className="bg-red-600 text-white text-sm px-3 py-1">High Risk</Badge>;
    case "MEDIUM":
      return <Badge className="bg-amber-500 text-white text-sm px-3 py-1">Medium Risk</Badge>;
    case "LOW":
      return <Badge className="bg-green-600 text-white text-sm px-3 py-1">Low Risk</Badge>;
    default:
      return <Badge variant="outline">{level}</Badge>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In progress</Badge>;
    case "REVIEW_DUE":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Review due</Badge>;
    case "ARCHIVED":
      return <Badge variant="secondary">Archived</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

function safeParseJson(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObject(value: string | null): Record<string, boolean> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

const PEOPLE_LABELS: Record<string, string> = {
  employees: "Employees",
  visitors: "Visitors",
  disabled: "Disabled persons",
  contractors: "Contractors",
  youngPersons: "Young persons",
  loneWorkers: "Lone workers",
};

export default async function FireRiskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getFireRiskAssessment(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const assessment = result.data as any;
  const now = new Date();
  const reviewOverdue =
    assessment.reviewDate &&
    new Date(assessment.reviewDate) < now &&
    assessment.status !== "ARCHIVED";

  const ignitionSources = safeParseJson(assessment.ignitionSources);
  const fuelSources = safeParseJson(assessment.fuelSources);
  const oxygenSources = safeParseJson(assessment.oxygenSources);
  const peopleAtRisk = safeParseObject(assessment.peopleAtRisk);
  const additionalMeasures = safeParseJson(assessment.additionalMeasures);

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/fire-risk">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{assessment.buildingName}</h1>
            {assessment.title !== assessment.buildingName && (
              <p className="text-sm text-muted-foreground">{assessment.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge(assessment.status)}
          {riskBadge(assessment.overallRiskLevel)}
        </div>
      </div>

      {reviewOverdue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Review overdue</p>
                <p className="text-sm text-red-700">
                  This assessment was due for review on{" "}
                  {format(new Date(assessment.reviewDate), "d MMMM yyyy", { locale: enGB })}.
                  The responsible person must review and update the fire risk assessment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Building details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Address:</span>{" "}
              {assessment.buildingAddress || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Maximum occupancy:</span>{" "}
              {assessment.maxOccupancy ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Assessed:</span>{" "}
              {assessment.assessedAt
                ? format(new Date(assessment.assessedAt), "d MMMM yyyy", { locale: enGB })
                : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Next review:</span>{" "}
              {assessment.reviewDate
                ? format(new Date(assessment.reviewDate), "d MMMM yyyy", { locale: enGB })
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Likelihood of fire:</span>{" "}
              {assessment.likelihoodOfFire ?? "—"} / 5
            </div>
            <div>
              <span className="text-muted-foreground">Consequence severity:</span>{" "}
              {assessment.consequenceSeverity ?? "—"} / 5
            </div>
            <div>
              <span className="text-muted-foreground">Score:</span>{" "}
              {assessment.likelihoodOfFire && assessment.consequenceSeverity
                ? assessment.likelihoodOfFire * assessment.consequenceSeverity
                : "—"}{" "}
              / 25
            </div>
            <div className="pt-2">{riskBadge(assessment.overallRiskLevel)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fire hazards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4" />
            Fire hazards identified
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">Sources of ignition</p>
            {ignitionSources.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                {ignitionSources.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None recorded</p>
            )}
          </div>
          <div>
            <p className="font-medium mb-1">Sources of fuel</p>
            {fuelSources.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                {fuelSources.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None recorded</p>
            )}
          </div>
          <div>
            <p className="font-medium mb-1">Sources of oxygen</p>
            {oxygenSources.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                {oxygenSources.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* People at risk */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">People at risk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(peopleAtRisk)
              .filter(([, value]) => value)
              .map(([key]) => (
                <Badge key={key} variant="outline">
                  {PEOPLE_LABELS[key] ?? key}
                </Badge>
              ))}
            {Object.values(peopleAtRisk).every((v) => !v) && (
              <p className="text-sm text-muted-foreground">None recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing fire safety measures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing fire safety measures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            {(
              [
                ["Fire detection", assessment.fireDetection],
                ["Fire alarm system", assessment.fireAlarmSystem],
                ["Emergency lighting", assessment.emergencyLighting],
                ["Fire extinguishers", assessment.fireExtinguishers],
                ["Escape routes", assessment.escapeRoutes],
                ["Signage", assessment.signage],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <p className="font-medium mb-1">{label}</p>
                <p className="text-muted-foreground">{value || "Not recorded"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional measures */}
      {additionalMeasures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Additional measures needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {additionalMeasures.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-medium shrink-0">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
