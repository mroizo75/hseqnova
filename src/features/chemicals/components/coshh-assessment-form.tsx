"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createCoshhAssessment } from "@/server/actions/coshh.actions";
import { CoshhLegalNote } from "@/features/chemicals/components/coshh-legal-note";
import { toast } from "sonner";

type ChemicalOption = { id: string; productName: string };

export function CoshhAssessmentForm({
  chemicals,
  initialChemicalId,
}: {
  chemicals: ChemicalOption[];
  initialChemicalId?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [chemicalId, setChemicalId] = useState(initialChemicalId ?? "");
  const [form, setForm] = useState({
    taskDescription: "",
    exposureRoutes: "",
    existingControls: "",
    additionalControls: "",
    healthSurveillance: false,
    reviewDueAt: "",
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await createCoshhAssessment({
        chemicalId,
        taskDescription: form.taskDescription,
        exposureRoutes: form.exposureRoutes,
        existingControls: form.existingControls,
        additionalControls: form.additionalControls || undefined,
        healthSurveillance: form.healthSurveillance,
        reviewDueAt: form.reviewDueAt ? new Date(form.reviewDueAt) : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("COSHH assessment created");
      router.push("/dashboard/coshh-assessments");
    } catch {
      toast.error("Could not create the assessment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/dashboard/coshh-assessments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to COSHH assessments
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">New COSHH assessment</h1>
        <p className="text-sm text-muted-foreground">
          Significant findings of the work involving a hazardous substance (COSHH 2002
          reg.6)
        </p>
      </div>

      <CoshhLegalNote />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Substance and task</CardTitle>
            <CardDescription>
              The assessment is of the work, not only the product (COSHH 2002 reg.6)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chemicalId">
                Hazardous substance <span className="text-red-500">*</span>
              </Label>
              <Select value={chemicalId} onValueChange={setChemicalId}>
                <SelectTrigger id="chemicalId">
                  <SelectValue placeholder="Select from the COSHH register" />
                </SelectTrigger>
                <SelectContent>
                  {chemicals.map((chemical) => (
                    <SelectItem key={chemical.id} value={chemical.id}>
                      {chemical.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chemicals.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Register the substance first in the COSHH register.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDescription">
                Task or activity <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="taskDescription"
                placeholder="e.g. Mixing adhesive in the workshop bay"
                value={form.taskDescription}
                onChange={(e) => update("taskDescription", e.target.value)}
                rows={3}
                required
                minLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exposureRoutes">
                How people may be exposed <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="exposureRoutes"
                placeholder="e.g. Inhalation of vapour, skin contact during mixing"
                value={form.exposureRoutes}
                onChange={(e) => update("exposureRoutes", e.target.value)}
                rows={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control measures</CardTitle>
            <CardDescription>
              Prevent or adequately control exposure (COSHH 2002 reg.7)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="existingControls">
                Existing controls <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="existingControls"
                placeholder="e.g. Local exhaust ventilation, nitrile gloves, safety goggles"
                value={form.existingControls}
                onChange={(e) => update("existingControls", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalControls">Further controls needed</Label>
              <Textarea
                id="additionalControls"
                placeholder="e.g. Fit RPE, install extraction hood over mixing area"
                value={form.additionalControls}
                onChange={(e) => update("additionalControls", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health surveillance and review</CardTitle>
            <CardDescription>
              COSHH 2002 reg.11 — the health record itself is kept in the exposure
              register
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="healthSurveillance">Health surveillance required</Label>
                <p className="text-xs text-muted-foreground">
                  Tick if the assessment shows identifiable disease or adverse health
                  effects may occur
                </p>
              </div>
              <Switch
                id="healthSurveillance"
                checked={form.healthSurveillance}
                onCheckedChange={(checked) => update("healthSurveillance", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewDueAt">Review due date</Label>
              <Input
                id="reviewDueAt"
                type="date"
                value={form.reviewDueAt}
                onChange={(e) => update("reviewDueAt", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Review regularly and whenever the assessment is no longer valid (reg.6(3)).
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create assessment
          </Button>
          <Link href="/dashboard/coshh-assessments">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
