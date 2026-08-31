import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  loadFireDrillUserNames,
  loadFireDrillsForList,
  loadNamedFireMarshals,
} from "@/server/queries/fire-drills.queries";
import { getAdminDb } from "@/lib/supabase/admin";
import { FireSafetyLegalNote } from "@/features/fire-risk/components/fire-safety-legal-note";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import {
  FIRE_DRILL_STATUS_LABELS,
  FIRE_DRILL_TYPE_LABELS,
  type FireDrillStatus,
  type FireDrillType,
} from "@/features/fire-drills/schemas/fire-drill.schema";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function getStatusConfig(status: FireDrillStatus) {
  const map: Record<FireDrillStatus, { className: string; icon: ReactNode }> = {
    PLANNED: {
      className: "bg-blue-100 text-blue-800",
      icon: <Clock className="h-3 w-3" />,
    },
    IN_PROGRESS: {
      className: "bg-yellow-100 text-yellow-800",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    COMPLETED: {
      className: "bg-orange-100 text-orange-800",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    EVALUATED: {
      className: "bg-green-100 text-green-800",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    CANCELLED: {
      className: "bg-gray-100 text-gray-600",
      icon: null,
    },
  };
  return map[status] ?? map.PLANNED;
}

export default async function AnsattBrannoevelserPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const [drills, userNames, fireMarshals, fraRes] = await Promise.all([
    loadFireDrillsForList(tenantId),
    loadFireDrillUserNames(tenantId),
    loadNamedFireMarshals(tenantId),
    getAdminDb()
      .from("FireRiskAssessment")
      .select("id, buildingName, status, reviewDate, overallRiskLevel, responsiblePersonName")
      .eq("tenantId", tenantId)
      .in("status", ["COMPLETED", "REVIEW_DUE"])
      .order("reviewDate", { ascending: true }),
  ]);
  const userMap = new Map(Object.entries(userNames));

  const upcoming = drills.filter(
    (d) => d.status === "PLANNED" || d.status === "IN_PROGRESS",
  );
  const past = drills.filter(
    (d) => d.status === "COMPLETED" || d.status === "EVALUATED" || d.status === "CANCELLED",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Flame className="h-7 w-7 text-red-600" />
          Fire safety
        </h1>
        <p className="text-sm text-muted-foreground">
          Fire risk assessment, fire marshals and drills — Fire Safety Order 2005
        </p>
      </div>

      <FireSafetyLegalNote />

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">Recorded fire risk assessments</p>
          {(fraRes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed fire risk assessment is on file yet. The responsible person
              records it under art.9.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(fraRes.data ?? []).map((row) => (
                <li key={row.id} className="rounded-lg border px-3 py-2">
                  <p className="font-medium">{row.buildingName}</p>
                  <p className="text-muted-foreground">
                    {row.responsiblePersonName ? `Responsible person: ${row.responsiblePersonName}. ` : ""}
                    {row.reviewDate
                      ? `Review by ${format(new Date(row.reviewDate), "d MMM yyyy", { locale: enGB })}.`
                      : ""}
                    {row.overallRiskLevel ? ` Risk: ${row.overallRiskLevel}.` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium">Fire marshals</p>
          {fireMarshals.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              No fire marshal is named yet. Ask your line manager who implements the
              evacuation (art.15(1)(b)).
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {fireMarshals.map((marshal) => (
                <li key={`${marshal.name}-${marshal.title}`}>
                  {marshal.name} — {marshal.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-blue-600" />
          Upcoming drills
        </h2>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Flame className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No upcoming fire drills planned</p>
              </CardContent>
            </Card>
          ) : (
            upcoming.map((drill) => {
              const statusCfg = getStatusConfig(drill.status as FireDrillStatus);
              return (
                <Card key={drill.id} className="border-l-4 border-l-red-400">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{drill.title}</h3>
                          <Badge className={`${statusCfg.className} flex items-center gap-1 text-xs`}>
                            {statusCfg.icon}
                            {FIRE_DRILL_STATUS_LABELS[drill.status as FireDrillStatus]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {FIRE_DRILL_TYPE_LABELS[drill.drillType as FireDrillType]}
                          </Badge>
                          {!drill.isAnnounced && (
                            <Badge variant="secondary" className="text-xs">
                              Unannounced
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {format(new Date(drill.plannedDate), "EEEE d MMMM yyyy", {
                                locale: enGB,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{drill.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              Person in charge: {userMap.get(drill.responsibleId) ?? "Not named"}
                            </span>
                          </div>
                        </div>

                        {drill.objectives && (
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Objectives:</span>{" "}
                            {drill.objectives}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Previous drills
          </h2>
          <div className="space-y-3">
            {past.map((drill) => {
              const statusCfg = getStatusConfig(drill.status as FireDrillStatus);
              return (
                <Card key={drill.id} className="opacity-80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{drill.title}</h3>
                          <Badge className={`${statusCfg.className} flex items-center gap-1 text-xs`}>
                            {statusCfg.icon}
                            {FIRE_DRILL_STATUS_LABELS[drill.status as FireDrillStatus]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {FIRE_DRILL_TYPE_LABELS[drill.drillType as FireDrillType]}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {format(new Date(drill.plannedDate), "d MMMM yyyy", {
                                locale: enGB,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{drill.location}</span>
                          </div>
                          {drill.actualParticipantCount != null && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 shrink-0" />
                              <span>{drill.actualParticipantCount} people taking part</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardContent className="p-4">
          <p className="text-sm text-red-900">
            <strong>Know your routes:</strong> The responsible person must practise
            evacuation procedures, including safety drills (Fire Safety Order 2005 art.15
            and art.21). Know the escape routes and assembly point. Ask your line manager
            if you are unsure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
