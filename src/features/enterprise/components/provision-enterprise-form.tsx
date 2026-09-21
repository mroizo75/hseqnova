"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { provisionEnterpriseOrganisation } from "@/server/actions/enterprise.actions";

export function ProvisionEnterpriseForm() {
  const [status, setStatus] = useState<string | null>(null);
  async function onSubmit(formData: FormData) {
    const result = await provisionEnterpriseOrganisation({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "OTHER"),
      ownerEmail: String(formData.get("ownerEmail") ?? ""),
      ownerName: String(formData.get("ownerName") ?? ""),
      programmeName: String(formData.get("programmeName") ?? "") || undefined,
    });
    setStatus(result.success ? `Created ${result.data.slug}.` : "error" in result ? result.error : "Failed.");
  }
  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="name">Organisation name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="type">Type</Label>
        <select id="type" name="type" className="h-11 w-full rounded-md border bg-transparent px-3 text-sm">
          <option value="INSURER">Insurer</option>
          <option value="BROKER">Broker</option>
          <option value="MGA">MGA</option>
          <option value="CORPORATE_GROUP">Corporate group</option>
          <option value="FRANCHISE">Franchise</option>
          <option value="CONTRACTOR_NETWORK">Contractor network</option>
          <option value="TRADE_ASSOCIATION">Trade association</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="programmeName">Programme name</Label>
        <Input id="programmeName" name="programmeName" placeholder="Safety Management Portal" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ownerName">Owner name</Label>
        <Input id="ownerName" name="ownerName" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ownerEmail">Owner email</Label>
        <Input id="ownerEmail" name="ownerEmail" type="email" required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit">Create enterprise organisation</Button>
      </div>
      {status ? <p className="text-sm text-muted-foreground sm:col-span-2">{status}</p> : null}
    </form>
  );
}
