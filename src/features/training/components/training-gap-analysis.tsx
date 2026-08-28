"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Bell,
} from "lucide-react";
import type { RoleGapUser } from "@/server/actions/role-training.actions";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  HMS: "HSE Manager",
  LEDER: "Line Manager",
  VERNEOMBUD: "Safety Representative",
  ANSATT: "Employee",
  BHT: "Occupational Health",
  REVISOR: "Auditor",
};

interface TrainingGapAnalysisProps {
  gaps: RoleGapUser[];
}

function StatusBadge({ status }: { status: "VALID" | "EXPIRING_SOON" | "EXPIRED" }) {
  switch (status) {
    case "VALID":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Valid
        </Badge>
      );
    case "EXPIRING_SOON":
      return (
        <Badge className="bg-yellow-100 text-black border-yellow-300 gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expiring soon
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
  }
}

export function TrainingGapAnalysis({ gaps }: TrainingGapAnalysisProps) {
  if (gaps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12">
          <CheckCircle2 className="mb-4 h-12 w-12 text-green-600" />
          <h3 className="text-xl font-semibold">No training gaps</h3>
          <p className="text-muted-foreground text-center">
            All employees have completed the training required for their role.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalMissing = gaps.reduce((sum, g) => sum + g.missingCourses.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Training Gap Analysis
        </CardTitle>
        <CardDescription>
          {gaps.length} employee{gaps.length !== 1 ? "s" : ""} with {totalMissing} missing
          course{totalMissing !== 1 ? "s" : ""} based on their role requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gaps.map((gap) => (
            <div
              key={gap.userId}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="font-semibold break-words">
                    {gap.userName ?? gap.email}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[gap.role] ?? gap.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {gap.email}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled title="Send training reminder (coming soon)" className="shrink-0 w-full sm:w-auto">
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                  Send reminder
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Missing / Expired
                  </p>
                  <div className="space-y-1">
                    {gap.missingCourses.map((course) => (
                      <div
                        key={course.courseKey}
                        className="flex items-center gap-2 text-sm"
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                        <span>{course.courseTitle}</span>
                        {course.isMandatory && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {gap.completedCourses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Completed
                    </p>
                    <div className="space-y-1">
                      {gap.completedCourses.map((course) => (
                        <div
                          key={course.courseKey}
                          className="flex items-center gap-2 text-sm"
                        >
                          <StatusBadge status={course.status} />
                          <span>{course.courseTitle}</span>
                          {course.validUntil && (
                            <span className="text-xs text-muted-foreground">
                              until {new Date(course.validUntil).toLocaleDateString("en-GB")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
