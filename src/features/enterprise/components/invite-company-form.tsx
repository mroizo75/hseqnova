"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteCompanyToPortfolio } from "@/server/actions/enterprise.actions";

export function InviteCompanyForm({
  portfolios,
}: {
  portfolios: Array<{ id: string; name: string }>;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setStatus(null);
    const result = await inviteCompanyToPortfolio({
      portfolioId: String(formData.get("portfolioId") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      companyNumber: String(formData.get("companyNumber") ?? "") || undefined,
      contactEmail: String(formData.get("contactEmail") ?? ""),
      relationshipType: String(formData.get("relationshipType") ?? "INSURED") as
        | "INSURED"
        | "GROUP_SUBSIDIARY"
        | "CONTRACTOR"
        | "FRANCHISEE"
        | "MEMBER"
        | "SUPPLY_CHAIN"
        | "OTHER",
    });
    setPending(false);
    setStatus(result.success ? "Invitation sent." : "error" in result ? result.error : "Failed.");
  }

  return (
    <form action={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" name="companyName" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="companyNumber">Companies House number</Label>
        <Input id="companyNumber" name="companyNumber" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contactEmail">Contact email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="portfolioId">Portfolio</Label>
        <select id="portfolioId" name="portfolioId" className="h-11 w-full rounded-md border bg-transparent px-3 text-sm">
          {portfolios.map((portfolio) => (
            <option key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="relationshipType">Relationship</Label>
        <select id="relationshipType" name="relationshipType" className="h-11 w-full rounded-md border bg-transparent px-3 text-sm">
          <option value="INSURED">Insured</option>
          <option value="GROUP_SUBSIDIARY">Group subsidiary</option>
          <option value="CONTRACTOR">Contractor</option>
          <option value="FRANCHISEE">Franchisee</option>
          <option value="MEMBER">Member</option>
          <option value="SUPPLY_CHAIN">Supply chain</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Invite company"}
        </Button>
      </div>
      {status ? <p className="sm:col-span-2 text-sm text-muted-foreground">{status}</p> : null}
    </form>
  );
}
