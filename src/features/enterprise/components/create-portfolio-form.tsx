"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEnterprisePortfolio } from "@/server/actions/enterprise.actions";
import { useState } from "react";

export function CreatePortfolioForm() {
  const [status, setStatus] = useState<string | null>(null);
  async function onSubmit(formData: FormData) {
    const result = await createEnterprisePortfolio({
      name: String(formData.get("name") ?? ""),
      sector: String(formData.get("sector") ?? "") || undefined,
      region: String(formData.get("region") ?? "") || undefined,
    });
    setStatus(result.success ? "Portfolio created." : "error" in result ? result.error : "Saved.");
  }
  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="sector">Sector</Label>
        <Input id="sector" name="sector" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="region">Region</Label>
        <Input id="region" name="region" />
      </div>
      <Button type="submit">Create portfolio</Button>
      {status ? <p className="text-sm text-muted-foreground sm:col-span-3">{status}</p> : null}
    </form>
  );
}
