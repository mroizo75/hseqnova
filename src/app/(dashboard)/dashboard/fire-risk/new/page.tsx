"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Flame, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { createFireRiskAssessment } from "@/server/actions/fire-risk.actions";
import { FireSafetyLegalNote } from "@/features/fire-risk/components/fire-safety-legal-note";

const LIKELIHOOD_LABELS: Record<number, string> = {
  1: "Very unlikely",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Very likely",
};

const CONSEQUENCE_LABELS: Record<number, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic",
};

function riskColour(likelihood: number, severity: number): string {
  const score = likelihood * severity;
  if (score >= 15) return "text-red-600";
  if (score >= 8) return "text-amber-600";
  return "text-green-600";
}

function riskLabel(likelihood: number, severity: number): string {
  const score = likelihood * severity;
  if (score >= 15) return "HIGH";
  if (score >= 8) return "MEDIUM";
  return "LOW";
}

export default function NewFireRiskPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");
  const [responsiblePersonName, setResponsiblePersonName] = useState("");
  const [responsiblePersonAddress, setResponsiblePersonAddress] = useState("");
  const [assessorName, setAssessorName] = useState("");
  const [assessorOrganisation, setAssessorOrganisation] = useState("");
  const [maxOccupancy, setMaxOccupancy] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  const [ignitionSources, setIgnitionSources] = useState<string[]>([""]);
  const [fuelSources, setFuelSources] = useState<string[]>([""]);
  const [oxygenSources, setOxygenSources] = useState<string[]>([""]);

  const [peopleAtRisk, setPeopleAtRisk] = useState({
    employees: true,
    visitors: false,
    disabled: false,
    contractors: false,
    youngPersons: false,
    loneWorkers: false,
  });

  const [fireDetection, setFireDetection] = useState("");
  const [fireAlarmSystem, setFireAlarmSystem] = useState("");
  const [emergencyLighting, setEmergencyLighting] = useState("");
  const [fireExtinguishers, setFireExtinguishers] = useState("");
  const [escapeRoutes, setEscapeRoutes] = useState("");
  const [signage, setSignage] = useState("");

  const [likelihood, setLikelihood] = useState(1);
  const [consequence, setConsequence] = useState(1);

  const [actions, setActions] = useState<string[]>([""]);

  function addListItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function updateListItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function removeListItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) {
    setter((prev) => (prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.tenantId) return;
    setSaving(true);
    setError(null);

    const nonEmpty = (arr: string[]) => arr.filter((s) => s.trim().length > 0);

    const result = await createFireRiskAssessment({
      tenantId: session.user.tenantId,
      title: title.trim() || buildingName.trim(),
      buildingName: buildingName.trim(),
      buildingAddress: buildingAddress.trim() || null,
      reviewDate: reviewDate || null,
      assessedAt: new Date().toISOString(),
      ignitionSources: nonEmpty(ignitionSources).length > 0 ? JSON.stringify(nonEmpty(ignitionSources)) : null,
      fuelSources: nonEmpty(fuelSources).length > 0 ? JSON.stringify(nonEmpty(fuelSources)) : null,
      oxygenSources: nonEmpty(oxygenSources).length > 0 ? JSON.stringify(nonEmpty(oxygenSources)) : null,
      peopleAtRisk: JSON.stringify(peopleAtRisk),
      maxOccupancy: maxOccupancy ? parseInt(maxOccupancy, 10) : null,
      fireDetection: fireDetection.trim() || null,
      fireAlarmSystem: fireAlarmSystem.trim() || null,
      emergencyLighting: emergencyLighting.trim() || null,
      fireExtinguishers: fireExtinguishers.trim() || null,
      escapeRoutes: escapeRoutes.trim() || null,
      signage: signage.trim() || null,
      likelihoodOfFire: likelihood,
      consequenceSeverity: consequence,
      additionalMeasures: nonEmpty(actions).length > 0 ? JSON.stringify(nonEmpty(actions)) : null,
      responsiblePersonName: responsiblePersonName.trim() || null,
      responsiblePersonAddress: responsiblePersonAddress.trim() || null,
      assessorName: assessorName.trim() || null,
      assessorOrganisation: assessorOrganisation.trim() || null,
    });

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/dashboard/fire-risk");
  }

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/fire-risk">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">New Fire Risk Assessment</h1>
          <p className="text-sm text-muted-foreground">
            Regulatory Reform (Fire Safety) Order 2005
          </p>
        </div>
      </div>

      <FireSafetyLegalNote />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Building details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              1. Building details
            </CardTitle>
            <CardDescription>
              Identify the premises being assessed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buildingName">Building name *</Label>
                <Input
                  id="buildingName"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g. Main Office, Warehouse A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Assessment title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Defaults to building name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildingAddress">Address</Label>
              <Textarea
                id="buildingAddress"
                value={buildingAddress}
                onChange={(e) => setBuildingAddress(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsiblePersonName">Responsible person *</Label>
                <Input
                  id="responsiblePersonName"
                  value={responsiblePersonName}
                  onChange={(e) => setResponsiblePersonName(e.target.value)}
                  placeholder="Name of the employer or person in control"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessorName">Who carried out this assessment *</Label>
                <Input
                  id="assessorName"
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  placeholder="May be the same person"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsiblePersonAddress">Responsible person UK address *</Label>
                <Textarea
                  id="responsiblePersonAddress"
                  value={responsiblePersonAddress}
                  onChange={(e) => setResponsiblePersonAddress(e.target.value)}
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessorOrganisation">Assessor organisation</Label>
                <Input
                  id="assessorOrganisation"
                  value={assessorOrganisation}
                  onChange={(e) => setAssessorOrganisation(e.target.value)}
                  placeholder="If an external assessor was engaged"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxOccupancy">Maximum occupancy</Label>
                <Input
                  id="maxOccupancy"
                  type="number"
                  min={0}
                  value={maxOccupancy}
                  onChange={(e) => setMaxOccupancy(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDate">Next review date *</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Fire hazards */}
        <Card>
          <CardHeader>
            <CardTitle>2. Identify fire hazards</CardTitle>
            <CardDescription>
              Article 9 — Sources of ignition, fuel, and oxygen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Sources of ignition</Label>
              {ignitionSources.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(setIgnitionSources, idx, e.target.value)}
                    placeholder="e.g. Electrical equipment, naked flames, heaters"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(setIgnitionSources, idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem(setIgnitionSources)}
              >
                <Plus className="mr-1 h-3 w-3" /> Add source
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Sources of fuel</Label>
              {fuelSources.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(setFuelSources, idx, e.target.value)}
                    placeholder="e.g. Paper, textiles, flammable liquids"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(setFuelSources, idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem(setFuelSources)}
              >
                <Plus className="mr-1 h-3 w-3" /> Add source
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Sources of oxygen</Label>
              {oxygenSources.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateListItem(setOxygenSources, idx, e.target.value)}
                    placeholder="e.g. Natural ventilation, air conditioning, oxidising chemicals"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(setOxygenSources, idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addListItem(setOxygenSources)}
              >
                <Plus className="mr-1 h-3 w-3" /> Add source
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: People at risk */}
        <Card>
          <CardHeader>
            <CardTitle>3. People at risk</CardTitle>
            <CardDescription>
              Identify all categories of people who may be at risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["employees", "Employees"],
                  ["visitors", "Visitors"],
                  ["disabled", "Disabled persons"],
                  ["contractors", "Contractors"],
                  ["youngPersons", "Young persons"],
                  ["loneWorkers", "Lone workers"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={peopleAtRisk[key]}
                    onChange={(e) =>
                      setPeopleAtRisk((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Existing fire safety measures */}
        <Card>
          <CardHeader>
            <CardTitle>4. Existing fire safety measures</CardTitle>
            <CardDescription>
              Record current fire precautions in place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fireDetection">Fire detection</Label>
                <Textarea
                  id="fireDetection"
                  value={fireDetection}
                  onChange={(e) => setFireDetection(e.target.value)}
                  placeholder="e.g. Smoke detectors in all rooms, heat detectors in kitchen"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fireAlarmSystem">Fire alarm system</Label>
                <Textarea
                  id="fireAlarmSystem"
                  value={fireAlarmSystem}
                  onChange={(e) => setFireAlarmSystem(e.target.value)}
                  placeholder="e.g. Conventional system, break-glass call points on each floor"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyLighting">Emergency lighting</Label>
                <Textarea
                  id="emergencyLighting"
                  value={emergencyLighting}
                  onChange={(e) => setEmergencyLighting(e.target.value)}
                  placeholder="e.g. Battery-backed emergency lighting on escape routes"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fireExtinguishers">Fire extinguishers</Label>
                <Textarea
                  id="fireExtinguishers"
                  value={fireExtinguishers}
                  onChange={(e) => setFireExtinguishers(e.target.value)}
                  placeholder="e.g. CO2 near electrical equipment, water on each floor"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escapeRoutes">Escape routes</Label>
                <Textarea
                  id="escapeRoutes"
                  value={escapeRoutes}
                  onChange={(e) => setEscapeRoutes(e.target.value)}
                  placeholder="e.g. Two staircases, fire doors on each floor, final exits front and rear"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signage">Signage</Label>
                <Textarea
                  id="signage"
                  value={signage}
                  onChange={(e) => setSignage(e.target.value)}
                  placeholder="e.g. Fire exit signs, fire action notices, assembly point signs"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Risk evaluation */}
        <Card>
          <CardHeader>
            <CardTitle>5. Risk evaluation</CardTitle>
            <CardDescription>
              Assess the likelihood of fire and severity of consequences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Likelihood of fire (1–5)</Label>
                <select
                  value={likelihood}
                  onChange={(e) => setLikelihood(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} — {LIKELIHOOD_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Consequence severity (1–5)</Label>
                <select
                  value={consequence}
                  onChange={(e) => setConsequence(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} — {CONSEQUENCE_LABELS[n]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">Overall risk level</p>
              <p className={`text-2xl font-bold ${riskColour(likelihood, consequence)}`}>
                {riskLabel(likelihood, consequence)} ({likelihood * consequence})
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Additional measures */}
        <Card>
          <CardHeader>
            <CardTitle>6. Additional measures needed</CardTitle>
            <CardDescription>
              Actions required to reduce fire risk further
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateListItem(setActions, idx, e.target.value)}
                  placeholder="e.g. Install additional fire extinguisher in reception"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeListItem(setActions, idx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addListItem(setActions)}
            >
              <Plus className="mr-1 h-3 w-3" /> Add action
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Link href="/dashboard/fire-risk">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving || !buildingName.trim()} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save assessment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
