import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { listFireRiskAssessments } from "@/server/actions/fire-risk.actions";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

function riskBadge(level: string | null) {
  if (!level) return <Badge variant="outline">Not assessed</Badge>;
  switch (level) {
    case "HIGH":
      return <Badge className="bg-red-600 text-white">High</Badge>;
    case "MEDIUM":
      return <Badge className="bg-amber-500 text-white">Medium</Badge>;
    case "LOW":
      return <Badge className="bg-green-600 text-white">Low</Badge>;
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

export default async function FireRiskPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const result = await listFireRiskAssessments(tenantId);
  const assessments = result.success ? result.data : [];

  const now = new Date();
  const stats = {
    total: assessments.length,
    overdue: assessments.filter(
      (a: any) => a.reviewDate && new Date(a.reviewDate) < now && a.status !== "ARCHIVED",
    ).length,
    highRisk: assessments.filter((a: any) => a.overallRiskLevel === "HIGH").length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Fire Risk Assessments</h1>
          <p className="text-sm text-muted-foreground">
            Regulatory Reform (Fire Safety) Order 2005 — Article 9
          </p>
        </div>
        <Link href="/dashboard/fire-risk/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New assessment
          </Button>
        </Link>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Flame className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-2">
                Legal requirement
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  The responsible person must carry out a fire risk assessment (Article 9)
                </li>
                <li>
                  Assessments must be reviewed regularly and when changes occur
                </li>
                <li>
                  General fire precautions must be implemented to reduce risk to life
                </li>
                <li>
                  Records must be kept where 5 or more persons are employed
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue reviews</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdue > 0 ? "text-amber-600" : ""}`}>
              {stats.overdue}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High risk buildings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.highRisk > 0 ? "text-red-600" : ""}`}>
              {stats.highRisk}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No assessments yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first fire risk assessment to comply with the Fire Safety Order 2005.
              </p>
              <Link href="/dashboard/fire-risk/new" className="mt-4 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New assessment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Building</th>
                    <th className="pb-3 font-medium">Risk level</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Review date</th>
                    <th className="pb-3 font-medium">Assessed</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a: any) => {
                    const reviewOverdue =
                      a.reviewDate && new Date(a.reviewDate) < now && a.status !== "ARCHIVED";
                    return (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3">
                          <Link
                            href={`/dashboard/fire-risk/${a.id}`}
                            className="font-medium hover:underline"
                          >
                            {a.buildingName}
                          </Link>
                          {a.title !== a.buildingName && (
                            <p className="text-xs text-muted-foreground">{a.title}</p>
                          )}
                        </td>
                        <td className="py-3">{riskBadge(a.overallRiskLevel)}</td>
                        <td className="py-3">{statusBadge(a.status)}</td>
                        <td className="py-3">
                          {a.reviewDate ? (
                            <span className={reviewOverdue ? "text-red-600 font-medium" : ""}>
                              {format(new Date(a.reviewDate), "d MMM yyyy", { locale: enGB })}
                              {reviewOverdue && " (overdue)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {a.assessedAt
                            ? format(new Date(a.assessedAt), "d MMM yyyy", { locale: enGB })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
