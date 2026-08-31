import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getStatusLabel, getStatusClasses } from "@/lib/status-labels";
import { formatGroupsAtRiskLabels } from "@/lib/risk-mhswr";

export const dynamic = "force-dynamic";

function getRiskColour(score: number) {
  if (score >= 20) return "bg-red-100 text-red-800 border-red-300";
  if (score >= 12) return "bg-orange-100 text-orange-800 border-orange-300";
  if (score >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
}

const TREND_ICON = {
  INCREASING: TrendingUp,
  DECREASING: TrendingDown,
  STABLE: Minus,
} as const;

export default async function EmployeeRisksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const risks = await prisma.risk.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: ["OPEN", "MITIGATING"] },
    },
    include: {
      owner: { select: { name: true } },
    },
    orderBy: { score: "desc" },
    take: 100,
  });

  const highRisks = risks.filter((r) => r.score >= 12);
  const mediumRisks = risks.filter((r) => r.score >= 6 && r.score < 12);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-sky-600" />
          Risk Assessments
        </h1>
        <p className="text-muted-foreground text-sm">
          Active risk assessments for your organisation. Required under MHSWR
          1999 reg.&nbsp;3 — suitable and sufficient risk assessments.
        </p>
      </div>

      {risks.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">High risk</p>
              <p className="text-3xl font-bold text-red-600">{highRisks.length}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Medium risk</p>
              <p className="text-3xl font-bold text-amber-600">{mediumRisks.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {risks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">No active risk assessments.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {risks.map((risk) => {
            const TrendIcon =
              TREND_ICON[risk.trend as keyof typeof TREND_ICON] ?? Minus;
            const statusClasses = getStatusClasses("risk", risk.status);
            const whoLabels = formatGroupsAtRiskLabels(risk.groupsAtRisk);

            return (
              <Card key={risk.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${getRiskColour(risk.score)}`}
                    >
                      {risk.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{risk.title}</h3>
                      {risk.context ? (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {risk.context}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`${statusClasses.bg} ${statusClasses.text} text-xs`}>
                          {getStatusLabel("risk", risk.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-1 flex items-center">
                          <TrendIcon className="h-3 w-3" />
                          {risk.trend}
                        </Badge>
                        {risk.category && (
                          <Badge variant="secondary" className="text-xs">
                            {risk.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {risk.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {risk.location}
                          </span>
                        )}
                        <span>
                          Likelihood: {risk.likelihood} &times; Consequence: {risk.consequence}
                        </span>
                      </div>
                      {whoLabels.length > 0 ? (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium text-foreground">Who might be harmed:</span>{" "}
                          {whoLabels.join(", ")}
                        </p>
                      ) : null}
                      {risk.existingControls && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          <span className="font-medium text-foreground">Existing controls:</span>{" "}
                          {risk.existingControls}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> If you identify a new hazard or believe a risk
            assessment is incorrect, report it to your line manager or raise an
            incident report.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
