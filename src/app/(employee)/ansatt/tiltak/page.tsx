import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ListChecks,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { getStatusLabel, getStatusClasses } from "@/lib/status-labels";
import { loadMeasuresForTenant } from "@/server/queries/measures.queries";
import { MeasureLegalNote } from "@/features/measures/components/measure-legal-note";
import { EmployeeActionUpdate } from "@/features/measures/components/employee-action-update";

export const dynamic = "force-dynamic";

export default async function EmployeeActionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId || !session.user.id) {
    redirect("/login");
  }

  const measures = await loadMeasuresForTenant(session.user.tenantId, {
    responsibleId: session.user.id,
  });

  const open = measures.filter(
    (m) => m.status === "PENDING" || m.status === "IN_PROGRESS" || m.status === "OVERDUE",
  );
  const overdue = open.filter((m) => m.status !== "DONE" && isPast(new Date(m.dueAt)));
  const completed = measures.filter((m) => m.status === "DONE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-emerald-600" />
          My Actions
        </h1>
        <p className="text-muted-foreground text-sm">
          Actions assigned to you. Record what you did and close them when the
          work is complete (MHSWR 1999 reg.5; HSG245).
        </p>
      </div>

      <MeasureLegalNote />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{open.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdue.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completed.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {measures.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="font-semibold mb-1">No actions assigned</h3>
            <p className="text-muted-foreground text-sm">
              You currently have no actions assigned to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {measures.map((measure) => {
            const isOverdue =
              measure.status !== "DONE" && isPast(new Date(measure.dueAt));
            const statusClasses = getStatusClasses("measure", measure.status);
            const source =
              measure.incident?.title ??
              measure.risk?.title ??
              measure.audit?.title ??
              null;

            return (
              <Card
                key={measure.id}
                className={isOverdue ? "border-l-4 border-l-red-500" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{measure.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`${statusClasses.bg} ${statusClasses.text} text-xs`}>
                          {getStatusLabel("measure", measure.status)}
                        </Badge>
                        {isOverdue && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            Overdue
                          </Badge>
                        )}
                        {source && (
                          <Badge variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Due: {format(new Date(measure.dueAt), "d MMM yyyy")}
                        </span>
                      </div>
                      {measure.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {measure.description}
                        </p>
                      )}
                      {measure.effectivenessNote && measure.status === "DONE" ? (
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Done: </span>
                          {measure.effectivenessNote}
                        </p>
                      ) : null}
                      <EmployeeActionUpdate
                        measureId={measure.id}
                        status={measure.status}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
