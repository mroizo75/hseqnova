import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getPermissions } from "@/lib/permissions";
import { loadFireDrillUserNames, loadFireDrillsForList } from "@/server/queries/fire-drills.queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { format, differenceInMonths } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  Plus,
  Flame,
  CheckCircle,
  Clock,
  AlertTriangle,
  CalendarDays,
  MapPin,
  User,
  ClipboardCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FIRE_DRILL_TYPE_LABELS,
  FIRE_DRILL_STATUS_LABELS,
} from "@/features/fire-drills/schemas/fire-drill.schema";
import type { FireDrillStatus, FireDrillType } from "@/features/fire-drills/schemas/fire-drill.schema";
import { FireDrillLegalNote } from "@/features/fire-drills/components/fire-drill-legal-note";

function getStatusBadge(status: FireDrillStatus) {
  const map: Record<FireDrillStatus, string> = {
    PLANNED: "bg-blue-100 text-blue-800 border-blue-200",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 border-yellow-200",
    COMPLETED: "bg-orange-100 text-orange-800 border-orange-200",
    EVALUATED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return {
    label: FIRE_DRILL_STATUS_LABELS[status] ?? FIRE_DRILL_STATUS_LABELS.PLANNED,
    className: map[status] ?? map.PLANNED,
  };
}

function getTypeBadge(type: FireDrillType) {
  const map: Record<FireDrillType, string> = {
    EVACUATION: "bg-red-50 text-red-700 border-red-200",
    FIRE_SUPPRESSION: "bg-orange-50 text-orange-700 border-orange-200",
    ALARM_TEST: "bg-purple-50 text-purple-700 border-purple-200",
    FULL_SCALE: "bg-red-100 text-red-900 border-red-300",
  };
  return map[type] ?? "";
}

export default async function FireDrillsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !session.user.tenantId) {
    return notFound();
  }

  const permissions = getPermissions(session.user.role);
  if (!permissions.canReadInspections) {
    redirect("/dashboard");
  }

  const [drills, userMap] = await Promise.all([
    loadFireDrillsForList(session.user.tenantId),
    loadFireDrillUserNames(session.user.tenantId),
  ]);

  const stats = {
    total: drills.length,
    planned: drills.filter((d) => d.status === "PLANNED").length,
    completed: drills.filter((d) => d.status === "COMPLETED").length,
    evaluated: drills.filter((d) => d.status === "EVALUATED").length,
  };

  const lastEvaluation = drills
    .filter((d) => d.status === "EVALUATED" && d.evaluatedAt)
    .sort(
      (a, b) =>
        new Date(b.evaluatedAt ?? 0).getTime() - new Date(a.evaluatedAt ?? 0).getTime(),
    )[0];

  const monthsSinceLast = lastEvaluation?.evaluatedAt
    ? differenceInMonths(new Date(), new Date(lastEvaluation.evaluatedAt))
    : null;

  const showAnnualReminder = monthsSinceLast === null || monthsSinceLast >= 10;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
            <Flame className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Fire drills</h1>
            <p className="text-muted-foreground mt-1">
              Plan, carry out and review fire drills — Fire Safety Order 2005 art.15
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/fire-drills/new">
            <Plus className="mr-2 h-4 w-4" />
            Plan a new drill
          </Link>
        </Button>
      </div>

      {showAnnualReminder && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Annual drill:</strong>{" "}
            {monthsSinceLast === null
              ? "No reviewed fire drill has been recorded yet."
              : `The last reviewed drill was ${monthsSinceLast} months ago.`}{" "}
            Practise evacuation at least once a year (Fire Safety Order 2005 art.15 and art.21).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All recorded drills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.planned}</div>
            <p className="text-xs text-muted-foreground">Upcoming drills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.evaluated}</div>
            <p className="text-xs text-muted-foreground">Record complete</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Drill history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drills.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Flame className="mx-auto mb-4 h-10 w-10 opacity-30" />
              <p className="font-medium">No drills recorded yet</p>
              <p className="mt-1 text-sm">
                Plan your first fire drill to meet Fire Safety Order 2005 duties.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/dashboard/fire-drills/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Plan a new drill
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Planned date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Drill leader</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Open actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drills.map((drill) => {
                      const statusStyle = getStatusBadge(drill.status);
                      const typeStyle = getTypeBadge(drill.drillType);
                      const openMeasures = drill.measures.filter(
                        (m) => m.status === "PENDING" || m.status === "IN_PROGRESS",
                      ).length;
                      return (
                        <TableRow key={drill.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Link
                              href={`/dashboard/fire-drills/${drill.id}`}
                              className="font-medium hover:underline"
                            >
                              {drill.title}
                            </Link>
                            {!drill.isAnnounced && (
                              <span className="ml-2 text-xs text-muted-foreground">(unannounced)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={typeStyle}>
                              {FIRE_DRILL_TYPE_LABELS[drill.drillType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                              {format(new Date(drill.plannedDate), "d MMM yyyy", { locale: enGB })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {drill.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {userMap[drill.responsibleId] ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {drill.actualParticipantCount != null ? (
                              <span className="text-sm font-medium">{drill.actualParticipantCount}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${statusStyle.className}`}>
                              {statusStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {openMeasures > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {openMeasures} open
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 md:hidden">
                {drills.map((drill) => {
                  const statusStyle = getStatusBadge(drill.status);
                  const typeStyle = getTypeBadge(drill.drillType);
                  const openMeasures = drill.measures.filter(
                    (m) => m.status === "PENDING" || m.status === "IN_PROGRESS",
                  ).length;
                  return (
                    <div key={drill.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/fire-drills/${drill.id}`}
                            className="font-medium hover:underline"
                          >
                            {drill.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">{drill.location}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={typeStyle}>
                          {FIRE_DRILL_TYPE_LABELS[drill.drillType]}
                        </Badge>
                        <span>
                          {format(new Date(drill.plannedDate), "d MMM yyyy", { locale: enGB })}
                        </span>
                        {openMeasures > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {openMeasures} open
                          </Badge>
                        ) : null}
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/dashboard/fire-drills/${drill.id}`}>Open</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <FireDrillLegalNote />
    </div>
  );
}
