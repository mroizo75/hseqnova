"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Flame,
  CheckCircle,
  ClipboardCheck,
  Users,
  Calendar,
  MapPin,
  User,
  Timer,
  Trash2,
  Download,
  AlertTriangle,
  Clock,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  FIRE_DRILL_TYPE_LABELS,
  FIRE_DRILL_STATUS_LABELS,
  OBJECTIVES_ACHIEVED_LABELS,
} from "@/features/fire-drills/schemas/fire-drill.schema";
import type { FireDrillStatus, FireDrillType } from "@/features/fire-drills/schemas/fire-drill.schema";
import type { ActionStatus } from "@prisma/client";

interface Measure {
  id: string;
  title: string;
  status: ActionStatus;
  dueAt: string;
  responsible: { id: string; name: string | null; email: string } | null;
}

interface FireDrill {
  id: string;
  title: string;
  drillType: FireDrillType;
  isAnnounced: boolean;
  status: FireDrillStatus;
  plannedDate: string;
  completedAt: string | null;
  location: string;
  responsibleId: string;
  objectives: string;
  scenario: string | null;
  riskAssessment: string | null;
  participantIds: string | null;
  actualParticipantCount: number | null;
  evacuationTimeSeconds: number | null;
  observations: string | null;
  objectivesAchieved: string | null;
  evaluation: string | null;
  improvementPoints: string | null;
  procedureChangesNeeded: boolean | null;
  procedureChangesDesc: string | null;
  evaluatedBy: string | null;
  evaluatedAt: string | null;
  // Delte lokaler — § 4 tredje ledd
  sharedPremises: boolean;
  buildingOwnerCoordinated: boolean | null;
  buildingOwnerName: string | null;
  otherTenantsInformed: boolean | null;
  fullBuildingEvacuation: boolean | null;
  totalBuildingOccupants: number | null;
  measures: Measure[];
  createdAt: string;
}

function StatusBadge({ status }: { status: FireDrillStatus }) {
  const map: Record<FireDrillStatus, { className: string }> = {
    PLANNED: { className: "bg-blue-100 text-blue-800 border-blue-200" },
    IN_PROGRESS: { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    COMPLETED: { className: "bg-orange-100 text-orange-800 border-orange-200" },
    EVALUATED: { className: "bg-green-100 text-green-800 border-green-200" },
    CANCELLED: { className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  return (
    <Badge variant="outline" className={`${map[status]?.className} text-xs`}>
      {FIRE_DRILL_STATUS_LABELS[status]}
    </Badge>
  );
}

function formatEvacTime(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m} min ${s} sec` : `${m} min`;
}

export default function FireDrillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [drill, setDrill] = useState<FireDrill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [activeTab, setActiveTab] = useState("plan");

  // Completion-skjema
  const [completeForm, setCompleteForm] = useState({
    completedAt: new Date().toISOString().substring(0, 10),
    actualParticipantCount: "",
    evacuationTimeSeconds: "",
    observations: "",
  });

  // Evaluerings-skjema
  const [evalForm, setEvalForm] = useState({
    objectivesAchieved: "",
    evaluation: "",
    improvementPoints: "",
    procedureChangesNeeded: false,
    procedureChangesDesc: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [drillRes, usersRes] = await Promise.all([
          fetch(`/api/fire-drills/${id}`),
          session?.user?.tenantId
            ? fetch(`/api/tenants/${session.user.tenantId}/users`)
            : Promise.resolve(null),
        ]);

        if (!drillRes.ok) { router.push("/dashboard/fire-drills"); return; }
        const drillData: FireDrill = await drillRes.json();
        setDrill(drillData);

        if (drillData.status === "COMPLETED") setActiveTab("evaluate");
        else if (drillData.status === "EVALUATED") setActiveTab("evaluate");

        if (usersRes?.ok) {
          const data = await usersRes.json();
          setUsers(data.users?.map((ut: { user: { id: string; name: string | null; email: string } }) => ut.user) ?? []);
        }
      } catch {
        router.push("/dashboard/fire-drills");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, session?.user?.tenantId, router]);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]));

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeForm.observations || !completeForm.actualParticipantCount) {
      toast({ title: "Complete participant numbers and observations", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/fire-drills/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date(completeForm.completedAt).toISOString(),
          actualParticipantCount: Number(completeForm.actualParticipantCount),
          evacuationTimeSeconds: completeForm.evacuationTimeSeconds
            ? Number(completeForm.evacuationTimeSeconds)
            : undefined,
          observations: completeForm.observations,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: FireDrill = await res.json();
      setDrill(updated);
      setActiveTab("evaluate");
      toast({ title: "Completion recorded", description: "The drill is ready for evaluation" });
    } catch (err) {
      toast({ title: "Could not save", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalForm.objectivesAchieved || !evalForm.evaluation || !evalForm.improvementPoints) {
      toast({ title: "Complete all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/fire-drills/${id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...evalForm,
          procedureChangesDesc: evalForm.procedureChangesDesc || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: FireDrill = await res.json();
      setDrill(updated);
      toast({ title: "Evaluation completed", description: "Documentation is now complete" });
    } catch (err) {
      toast({ title: "Could not save", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/fire-drills/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Could not delete the drill");
      toast({ title: "Drill deleted" });
      router.push("/dashboard/fire-drills");
    } catch {
      toast({ title: "Could not delete the drill", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading drill...</div>
      </div>
    );
  }

  if (!drill) return null;

  const canComplete = drill.status === "PLANNED" || drill.status === "IN_PROGRESS";
  const canEvaluate = drill.status === "COMPLETED";
  const isEvaluated = drill.status === "EVALUATED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/fire-drills">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isEvaluated && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/fire-drills/${id}/rapport`} target="_blank" rel="noopener noreferrer">
                <Download className="mr-1.5 h-4 w-4" />
                Download report
              </a>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete fire drill?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes “{drill.title}”, including all documentation. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tittel-seksjon */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
          <Flame className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{drill.title}</h1>
            <StatusBadge status={drill.status} />
            <Badge variant="outline" className="text-xs">
              {FIRE_DRILL_TYPE_LABELS[drill.drillType]}
            </Badge>
            {!drill.isAnnounced && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                Unannounced
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(drill.plannedDate), "d. MMMM yyyy", { locale: enGB })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {drill.location}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {userMap[drill.responsibleId] ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plan" className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            Plan
          </TabsTrigger>
          <TabsTrigger value="complete" className="flex items-center gap-1.5" disabled={isEvaluated && !canComplete}>
            <Users className="h-4 w-4" />
            Completion
            {canComplete && <span className="ml-1 h-2 w-2 rounded-full bg-orange-400" />}
          </TabsTrigger>
          <TabsTrigger value="evaluate" className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" />
            Review
            {canEvaluate && <span className="ml-1 h-2 w-2 rounded-full bg-orange-400" />}
          </TabsTrigger>
          <TabsTrigger value="measures" className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Actions ({drill.measures.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: PLAN */}
        <TabsContent value="plan" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planned details</CardTitle>
              <CardDescription>Basis for carrying out and evaluating the drill</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Drill objectives</p>
                <p className="text-sm whitespace-pre-line">{drill.objectives}</p>
              </div>
              {drill.scenario && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Scenario</p>
                    <p className="text-sm whitespace-pre-line">{drill.scenario}</p>
                  </div>
                </>
              )}
              {drill.riskAssessment && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Risk assessment</p>
                    <p className="text-sm whitespace-pre-line">{drill.riskAssessment}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delte lokaler — § 4 tredje ledd */}
          {drill.sharedPremises && (
            <Card className="border bg-muted/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Shared building — co-ordination (art.22)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {drill.buildingOwnerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Building owner / coordinating responsible person</span>
                    <span className="font-medium">{drill.buildingOwnerName}</span>
                  </div>
                )}
                {drill.totalBuildingOccupants != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">People in the building</span>
                    <span className="font-medium">{drill.totalBuildingOccupants} people</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className={drill.buildingOwnerCoordinated ? "text-green-600" : "text-red-500"}>
                      {drill.buildingOwnerCoordinated ? "✓" : "✗"}
                    </span>
                    <span className="text-muted-foreground">Building owner coordinated and informed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={drill.otherTenantsInformed ? "text-green-600" : "text-muted-foreground"}>
                      {drill.otherTenantsInformed ? "✓" : "—"}
                    </span>
                    <span className="text-muted-foreground">Other tenants informed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={drill.fullBuildingEvacuation ? "text-green-600" : "text-muted-foreground"}>
                      {drill.fullBuildingEvacuation ? "✓" : "—"}
                    </span>
                    <span className="text-muted-foreground">Joint evacuation drill for the whole building</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {canComplete && (
            <Button onClick={() => setActiveTab("complete")}>
              <Users className="mr-2 h-4 w-4" />
              Record completion
            </Button>
          )}
        </TabsContent>

        {/* TAB: GJENNOMFØRING */}
        <TabsContent value="complete" className="space-y-4 pt-4">
          {(isEvaluated || drill.status === "COMPLETED") && drill.completedAt ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Completion recorded
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Completion date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(drill.completedAt), "d. MMMM yyyy", { locale: enGB })}
                    </p>
                  </div>
                  {drill.actualParticipantCount != null && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Participants</p>
                      <p className="text-sm font-medium">{drill.actualParticipantCount} people</p>
                    </div>
                  )}
                  {drill.evacuationTimeSeconds != null && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        Evacuation time
                      </p>
                      <p className="text-sm font-medium">{formatEvacTime(drill.evacuationTimeSeconds)}</p>
                    </div>
                  )}
                </div>
                {drill.observations && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Observations</p>
                      <p className="text-sm whitespace-pre-line">{drill.observations}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : canComplete ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Record completion</CardTitle>
                <CardDescription>
                  Number of participants and observations are required records (Fire Safety Order 2005)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleComplete} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="completedAt">
                        Completion date <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="completedAt"
                        type="date"
                        value={completeForm.completedAt}
                        onChange={(e) =>
                          setCompleteForm((p) => ({ ...p, completedAt: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualParticipantCount">
                        Number of participants <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="actualParticipantCount"
                        type="number"
                        min="1"
                        value={completeForm.actualParticipantCount}
                        onChange={(e) =>
                          setCompleteForm((p) => ({
                            ...p,
                            actualParticipantCount: e.target.value,
                          }))
                        }
                        placeholder="e.g. 24"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Required — Fire Safety Order 2005</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evacuationTimeSeconds">
                      Evacuation time (seconds)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="evacuationTimeSeconds"
                        type="number"
                        min="1"
                        value={completeForm.evacuationTimeSeconds}
                        onChange={(e) =>
                          setCompleteForm((p) => ({
                            ...p,
                            evacuationTimeSeconds: e.target.value,
                          }))
                        }
                        placeholder="e.g. 180 (3 min)"
                        className="max-w-[200px]"
                      />
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      {completeForm.evacuationTimeSeconds && (
                        <span className="text-sm text-muted-foreground">
                          = {formatEvacTime(Number(completeForm.evacuationTimeSeconds))}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">
                      Observations during the drill <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="observations"
                      value={completeForm.observations}
                      onChange={(e) =>
                        setCompleteForm((p) => ({ ...p, observations: e.target.value }))
                      }
                      placeholder="Describe what was observed during the drill. What worked? What did not?"
                      rows={5}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required — Fire Safety Order 2005</p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="submit" disabled={saving}>
                      <Clock className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Record completion"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Clock className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p>The drill has not been completed yet.</p>
                {drill.status === "PLANNED" && (
                  <p className="text-sm mt-1">Go to the Plan tab to start the drill.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: EVALUERING */}
        <TabsContent value="evaluate" className="space-y-4 pt-4">
          {isEvaluated ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Evaluation complete — duty met
                </CardTitle>
                {drill.evaluatedAt && (
                  <CardDescription>
                    Reviewed {format(new Date(drill.evaluatedAt), "d MMMM yyyy", { locale: enGB })}
                    {drill.evaluatedBy && userMap[drill.evaluatedBy]
                      ? ` by ${userMap[drill.evaluatedBy]}`
                      : ""}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Objectives met</p>
                  <Badge
                    variant="outline"
                    className={
                      drill.objectivesAchieved === "FULL"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : drill.objectivesAchieved === "PARTIAL"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }
                  >
                    {drill.objectivesAchieved
                      ? OBJECTIVES_ACHIEVED_LABELS[drill.objectivesAchieved]
                      : "—"}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Review</p>
                  <p className="text-sm whitespace-pre-line">{drill.evaluation}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Improvement points</p>
                  <p className="text-sm whitespace-pre-line">{drill.improvementPoints}</p>
                </div>
                {drill.procedureChangesNeeded && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <p className="text-xs font-medium text-orange-800 mb-1">
                        Procedure changes needed
                      </p>
                      {drill.procedureChangesDesc && (
                        <p className="text-sm text-orange-700">{drill.procedureChangesDesc}</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : canEvaluate ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluate the drill</CardTitle>
                <CardDescription>
                  Evaluation and improvement points are required records (Fire Safety Order 2005)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEvaluate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectivesAchieved">
                      Were the objectives met? <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={evalForm.objectivesAchieved}
                      onValueChange={(v) => setEvalForm((p) => ({ ...p, objectivesAchieved: v }))}
                    >
                      <SelectTrigger id="objectivesAchieved">
                        <SelectValue placeholder="Select whether objectives were met" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OBJECTIVES_ACHIEVED_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evaluation">
                      Review notes <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="evaluation"
                      value={evalForm.evaluation}
                      onChange={(e) => setEvalForm((p) => ({ ...p, evaluation: e.target.value }))}
                      placeholder="What went well? What went poorly? Was the drill realistic?"
                      rows={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required — Fire Safety Order 2005</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="improvementPoints">
                      Improvement points <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="improvementPoints"
                      value={evalForm.improvementPoints}
                      onChange={(e) =>
                        setEvalForm((p) => ({ ...p, improvementPoints: e.target.value }))
                      }
                      placeholder="What concrete improvements should be made before the next drill?"
                      rows={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required — Fire Safety Order 2005</p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="text-sm font-medium">Procedure changes needed?</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Did the drill identify a need to change procedures?
                      </p>
                    </div>
                    <Switch
                      checked={evalForm.procedureChangesNeeded}
                      onCheckedChange={(v) =>
                        setEvalForm((p) => ({ ...p, procedureChangesNeeded: v }))
                      }
                    />
                  </div>

                  {evalForm.procedureChangesNeeded && (
                    <div className="space-y-2">
                      <Label htmlFor="procedureChangesDesc">Describe required changes</Label>
                      <Textarea
                        id="procedureChangesDesc"
                        value={evalForm.procedureChangesDesc}
                        onChange={(e) =>
                          setEvalForm((p) => ({ ...p, procedureChangesDesc: e.target.value }))
                        }
                        placeholder="Which procedures must change and how?"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Complete evaluation"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p>Evaluation is available after the drill has been completed.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: TILTAK */}
        <TabsContent value="measures" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Follow-up actions</h3>
              <p className="text-sm text-muted-foreground">
                Actions to correct and prevent identified shortcomings
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/actions/new?fireDrillId=${id}`}>
                Add action
              </Link>
            </Button>
          </div>

          {drill.measures.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p>No actions recorded yet.</p>
                <p className="text-sm mt-1">
                  Add follow-up actions from the improvement points in the evaluation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {drill.measures.map((measure) => (
                <Card key={measure.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{measure.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Deadline: {format(new Date(measure.dueAt), "d. MMM yyyy", { locale: enGB })}
                          </span>
                          {measure.responsible && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {measure.responsible.name ?? measure.responsible.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          measure.status === "DONE"
                            ? "bg-green-50 text-green-700"
                            : measure.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-50 text-gray-700"
                        }
                      >
                        {measure.status === "DONE"
                          ? "Completed"
                          : measure.status === "IN_PROGRESS"
                            ? "In progress"
                            : "Pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
