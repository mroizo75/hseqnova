"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEnterpriseStandard } from "@/server/actions/enterprise.actions";

export function CreateStandardForm() {
  const [status, setStatus] = useState<string | null>(null);
  async function onSubmit(formData: FormData) {
    const result = await createEnterpriseStandard({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      rules: [
        { domainKey: "RISKS", ruleKey: "risks_current", label: "Risk assessments current" },
        { domainKey: "ACTIONS", ruleKey: "critical_actions_resolved", label: "Critical actions resolved" },
        { domainKey: "TRAINING", ruleKey: "training_current", label: "Training current" },
      ],
    });
    setStatus(result.success ? "Standard created." : "error" in result ? result.error : "Saved.");
  }
  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" />
      </div>
      <p className="text-xs text-muted-foreground">
        Starts with risk assessments, corrective actions and training. You can extend requirements later.
      </p>
      <Button type="submit">Create standard</Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </form>
  );
}
