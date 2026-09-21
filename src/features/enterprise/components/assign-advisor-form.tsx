"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assignAdvisor } from "@/server/actions/enterprise.actions";

export function AssignAdvisorForm({ enterpriseId }: { enterpriseId: string }) {
  const [status, setStatus] = useState<string | null>(null);
  async function onSubmit(formData: FormData) {
    const result = await assignAdvisor({
      email: String(formData.get("email") ?? ""),
      scopeType: "ENTERPRISE",
      scopeId: enterpriseId,
      canAssistInWorkspace: formData.get("assist") === "on",
    });
    setStatus(result.success ? "Advisor assigned." : "error" in result ? result.error : "Saved.");
  }
  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="email">Advisor email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="assist" />
        May be invited into a company workspace
      </label>
      <Button type="submit">Assign advisor</Button>
      {status ? <p className="text-sm text-muted-foreground sm:col-span-2">{status}</p> : null}
    </form>
  );
}
