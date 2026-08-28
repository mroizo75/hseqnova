import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { PageHelpDialog } from "@/components/dashboard/page-help-dialog";
import { helpContent } from "@/lib/help-content";
import { listCoshhAssessments } from "@/server/actions/coshh.actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(text: string | null, maxLength = 80): string {
  if (!text) return "—";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

export default async function CoshhAssessmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const assessments = await listCoshhAssessments();

  const stats = {
    total: assessments.length,
    overdue: assessments.filter((a) => isOverdue(a.reviewDueAt)).length,
    healthSurveillance: assessments.filter((a) => a.healthSurveillance).length,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              COSHH Assessments
            </h1>
            <p className="text-sm text-muted-foreground">
              Assess exposure to hazardous substances and record control measures
            </p>
          </div>
          {helpContent.coshhAssessments && (
            <PageHelpDialog content={helpContent.coshhAssessments} />
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/dashboard/coshh-assessments/new">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New assessment
            </Button>
          </Link>
        </div>
      </div>

      {/* COSHH 2002 legal reference */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-2">
                COSHH 2002 — Control of Substances Hazardous to Health Regulations
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Assess exposure for every hazardous substance used at work (reg. 6)</li>
                <li>Prevent or adequately control exposure (reg. 7)</li>
                <li>Provide information, instruction and training (reg. 12)</li>
                <li>Arrange health surveillance where the assessment shows it is appropriate (reg. 11)</li>
                <li>Keep health surveillance records for 40 years (reg. 11(4))</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Recorded COSHH assessments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue reviews</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Review date has passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health surveillance</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.healthSurveillance}</div>
            <p className="text-xs text-muted-foreground">Require health surveillance (reg. 11)</p>
          </CardContent>
        </Card>
      </div>

      {/* Assessments table */}
      <Card className="w-full min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>All assessments</CardTitle>
          <CardDescription>
            COSHH assessments for hazardous substances used in your organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          {assessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No assessments yet</p>
              <p className="text-sm mt-1">
                Create your first COSHH assessment to record how hazardous substances are controlled.
              </p>
              <Link href="/dashboard/coshh-assessments/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  New assessment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task / activity</TableHead>
                    <TableHead>Existing controls</TableHead>
                    <TableHead>Additional controls</TableHead>
                    <TableHead>Health surveillance</TableHead>
                    <TableHead>Review due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((a) => {
                    const overdue = isOverdue(a.reviewDueAt);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium max-w-[250px]">
                          <span className="line-clamp-2">{a.taskDescription}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2 text-sm text-muted-foreground">
                            {truncate(a.existingControls)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="line-clamp-2 text-sm text-muted-foreground">
                            {truncate(a.additionalControls)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {a.healthSurveillance ? (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Not required
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              overdue ? "text-red-600 font-medium" : "text-muted-foreground"
                            }
                          >
                            {overdue && <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />}
                            {formatDate(a.reviewDueAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
