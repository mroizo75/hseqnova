"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { FIRE_DRILL_TYPE_LABELS } from "@/features/fire-drills/schemas/fire-drill.schema";
import type { FireDrillType } from "@/features/fire-drills/schemas/fire-drill.schema";
import { FireDrillLegalNote } from "@/features/fire-drills/components/fire-drill-legal-note";

interface TenantUser {
  user: { id: string; name: string | null; email: string };
}

export default function NewFireDrillPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [form, setForm] = useState({
    title: "",
    drillType: "EVACUATION" as FireDrillType,
    isAnnounced: true,
    plannedDate: "",
    location: "",
    responsibleId: "",
    objectives: "",
    scenario: "",
    riskAssessment: "",
    sharedPremises: false,
    buildingOwnerCoordinated: false,
    buildingOwnerName: "",
    otherTenantsInformed: false,
    fullBuildingEvacuation: false,
    totalBuildingOccupants: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.tenantId) return;
      try {
        const res = await fetch(`/api/tenants/${session.user.tenantId}/users`);
        const data = await res.json();
        if (res.ok && data.users) {
          setUsers(data.users);
          if (session.user.id) {
            setForm((prev) => ({ ...prev, responsibleId: session.user.id ?? "" }));
          }
        }
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [session?.user?.tenantId, session?.user?.id]);

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.plannedDate || !form.location || !form.responsibleId || !form.objectives) {
      toast({ title: "Complete all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/fire-drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plannedDate: new Date(form.plannedDate).toISOString(),
          scenario: form.scenario || undefined,
          riskAssessment: form.riskAssessment || undefined,
          buildingOwnerName: form.sharedPremises ? form.buildingOwnerName || undefined : undefined,
          totalBuildingOccupants:
            form.sharedPremises && form.totalBuildingOccupants
              ? parseInt(form.totalBuildingOccupants, 10)
              : undefined,
          buildingOwnerCoordinated: form.sharedPremises ? form.buildingOwnerCoordinated : undefined,
          otherTenantsInformed: form.sharedPremises ? form.otherTenantsInformed : undefined,
          fullBuildingEvacuation: form.sharedPremises ? form.fullBuildingEvacuation : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Could not plan the drill");
      }

      const drill = await res.json();
      toast({ title: "Fire drill planned", description: form.title });
      router.push(`/dashboard/fire-drills/${drill.id}`);
    } catch (error) {
      toast({
        title: "Could not create drill",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/fire-drills">
          <Button variant="ghost" size="icon" aria-label="Back to fire drills">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan a fire drill</h1>
          <p className="text-muted-foreground">
            Record the drill here. Keep it with the fire risk assessment — do not send it to the HSE.
          </p>
        </div>
      </div>

      <FireDrillLegalNote />

      <Card>
        <CardHeader>
          <CardTitle>Drill record</CardTitle>
          <CardDescription>
            Date, time, location and drill leader. Add objectives so the review has something to measure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Evacuation drill — warehouse A — Q1 2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drillType">
                  Drill type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.drillType}
                  onValueChange={(value) => set("drillType", value as FireDrillType)}
                >
                  <SelectTrigger id="drillType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(FIRE_DRILL_TYPE_LABELS) as [FireDrillType, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedDate">
                  Planned date and time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plannedDate"
                  type="datetime-local"
                  value={form.plannedDate}
                  onChange={(e) => set("plannedDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location / building <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Office, warehouse, production hall"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibleId">
                  Drill leader <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.responsibleId}
                  onValueChange={(value) => set("responsibleId", value)}
                  disabled={loadingUsers}
                >
                  <SelectTrigger id="responsibleId">
                    <SelectValue
                      placeholder={loadingUsers ? "Loading people..." : "Select drill leader"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((entry) => (
                      <SelectItem key={entry.user.id} value={entry.user.id}>
                        {entry.user.name ?? entry.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={!form.isAnnounced}
                onCheckedChange={(value) => set("isAnnounced", value !== true)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="font-medium">Unannounced drill</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Leave unchecked for a planned, announced drill. Tick for a more realistic response.
                </span>
              </span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="objectives">
                Drill objectives <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="objectives"
                value={form.objectives}
                onChange={(e) => set("objectives", e.target.value)}
                placeholder="What will be practised, who takes part, and what good looks like. e.g. All employees in building A evacuate to the assembly point within 3 minutes."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scenario">Scenario</Label>
                <Textarea
                  id="scenario"
                  value={form.scenario}
                  onChange={(e) => set("scenario", e.target.value)}
                  placeholder="e.g. Assumed fire start on the first floor, smoke in the corridor."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskAssessment">Risks during the drill</Label>
                <Textarea
                  id="riskAssessment"
                  value={form.riskAssessment}
                  onChange={(e) => set("riskAssessment", e.target.value)}
                  placeholder="Recommended if you use smoke, alarms or blocked routes. Describe the risks and controls."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
                <Checkbox
                  checked={form.sharedPremises}
                  onCheckedChange={(value) => set("sharedPremises", value === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="font-medium">Shared building</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Tick if another responsible person shares the premises. Co-ordinate the drill
                    (Fire Safety Order 2005 art.22).
                  </span>
                </span>
              </label>

              {form.sharedPremises ? (
                <div className="space-y-4 rounded-md border bg-muted/40 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="buildingOwnerName">
                        Building owner or co-ordinating responsible person
                      </Label>
                      <Input
                        id="buildingOwnerName"
                        value={form.buildingOwnerName}
                        onChange={(e) => set("buildingOwnerName", e.target.value)}
                        placeholder="Landlord, facilities manager or responsible person"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalBuildingOccupants">People in the building during the drill</Label>
                      <Input
                        id="totalBuildingOccupants"
                        type="number"
                        min={1}
                        value={form.totalBuildingOccupants}
                        onChange={(e) => set("totalBuildingOccupants", e.target.value)}
                        placeholder="All organisations and visitors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-1">
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={form.buildingOwnerCoordinated}
                        onCheckedChange={(value) => set("buildingOwnerCoordinated", value === true)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">Building owner informed and co-ordinated</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Art.22: each responsible person must co-operate so the evacuation works.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={form.otherTenantsInformed}
                        onCheckedChange={(value) => set("otherTenantsInformed", value === true)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">Other occupiers informed</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Avoids an unexpected alarm for neighbouring organisations.
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox
                        checked={form.fullBuildingEvacuation}
                        onCheckedChange={(value) => set("fullBuildingEvacuation", value === true)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">Whole-building evacuation</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Tick if the drill covers the whole building, not only your premises.
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/fire-drills">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || loadingUsers || !form.responsibleId}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Plan drill"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
