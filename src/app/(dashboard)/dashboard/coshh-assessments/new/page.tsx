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
import { ArrowLeft, Loader2 } from "lucide-react";
import { createCoshhAssessment } from "@/server/actions/coshh.actions";
import { toast } from "sonner";

export default function NewCoshhAssessmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
    if (!form.taskDescription.trim()) {
      toast.error("Task description is required");
      return;
    }

    setSaving(true);
    try {
      await createCoshhAssessment({
        taskDescription: form.taskDescription,
        exposureRoutes: form.exposureRoutes || undefined,
        existingControls: form.existingControls || undefined,
        additionalControls: form.additionalControls || undefined,
        healthSurveillance: form.healthSurveillance,
        reviewDueAt: form.reviewDueAt ? new Date(form.reviewDueAt) : undefined,
      });
      toast.success("COSHH assessment created");
      router.push("/dashboard/coshh-assessments");
    } catch {
      toast.error("Failed to create assessment");
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
          Record a COSHH assessment for a task involving hazardous substances (COSHH 2002 reg. 6)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Task and exposure</CardTitle>
            <CardDescription>
              Describe the task, who is exposed, and by what route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskDescription">
                Task or activity description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="taskDescription"
                placeholder="e.g. Mixing adhesive in the workshop bay"
                value={form.taskDescription}
                onChange={(e) => update("taskDescription", e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exposureRoutes">Exposure routes</Label>
              <Textarea
                id="exposureRoutes"
                placeholder="e.g. Inhalation of vapour, skin contact during mixing"
                value={form.exposureRoutes}
                onChange={(e) => update("exposureRoutes", e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Inhalation, skin absorption, ingestion, injection — list all relevant routes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control measures</CardTitle>
            <CardDescription>
              Prevent or adequately control exposure (COSHH 2002 reg. 7)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="existingControls">Existing controls</Label>
              <Textarea
                id="existingControls"
                placeholder="e.g. Local exhaust ventilation, nitrile gloves, safety goggles"
                value={form.existingControls}
                onChange={(e) => update("existingControls", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalControls">Additional controls needed</Label>
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
              COSHH 2002 reg. 11 requires health surveillance where the assessment shows it is appropriate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="healthSurveillance">Health surveillance required</Label>
                <p className="text-xs text-muted-foreground">
                  Tick if employees are exposed to substances linked to identifiable disease or adverse health effects
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
                COSHH assessments should be reviewed regularly and whenever there is reason to believe they are no longer valid
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
