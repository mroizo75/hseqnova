"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addEnterpriseUser,
  importCompaniesCsv,
  updateEnterpriseBranding,
} from "@/server/actions/enterprise.actions";

export function AdministrationForms(props: {
  canManageUsers: boolean;
  canManageBranding: boolean;
  canImport: boolean;
  portfolios: Array<{ id: string; name: string }>;
  branding: {
    programmeName: string | null;
    welcomeText: string | null;
    primaryColour: string | null;
    analyticsEnabled: boolean;
    benchmarkEnabled: boolean;
    showPoweredBy: boolean;
  };
}) {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {props.canManageBranding ? (
        <form
          className="space-y-3"
          action={async (formData) => {
            const result = await updateEnterpriseBranding({
              programmeName: String(formData.get("programmeName") ?? "") || undefined,
              welcomeText: String(formData.get("welcomeText") ?? "") || undefined,
              primaryColour: String(formData.get("primaryColour") ?? "") || undefined,
              showPoweredBy: formData.get("showPoweredBy") === "on",
              analyticsEnabled: formData.get("analyticsEnabled") === "on",
              benchmarkEnabled: formData.get("benchmarkEnabled") === "on",
            });
            setStatus(result.success ? "Branding saved." : "error" in result ? result.error : "Saved.");
          }}
        >
          <h2 className="text-lg font-semibold">White label</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="programmeName">Programme name</Label>
              <Input id="programmeName" name="programmeName" defaultValue={props.branding.programmeName ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="primaryColour">Primary colour</Label>
              <Input id="primaryColour" name="primaryColour" defaultValue={props.branding.primaryColour ?? ""} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="welcomeText">Welcome text</Label>
            <Input id="welcomeText" name="welcomeText" defaultValue={props.branding.welcomeText ?? ""} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showPoweredBy" defaultChecked={props.branding.showPoweredBy} />
            Show “Powered by HSEQ Nova”
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="analyticsEnabled" defaultChecked={props.branding.analyticsEnabled} />
            Enable Portfolio Analytics add-on
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="benchmarkEnabled" defaultChecked={props.branding.benchmarkEnabled} />
            Enable Risk Intelligence add-on
          </label>
          <Button type="submit">Save</Button>
        </form>
      ) : null}

      {props.canManageUsers ? (
        <form
          className="space-y-3"
          action={async (formData) => {
            const result = await addEnterpriseUser({
              email: String(formData.get("email") ?? ""),
              role: String(formData.get("role") ?? "READ_ONLY") as never,
            });
            setStatus(result.success ? "User added." : "error" in result ? result.error : "Saved.");
          }}
        >
          <h2 className="text-lg font-semibold">Add enterprise user</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <select id="role" name="role" className="h-11 w-full rounded-md border bg-transparent px-3 text-sm">
                <option value="ADMIN">Administrator</option>
                <option value="PORTFOLIO_MANAGER">Portfolio manager</option>
                <option value="HSEQ_MANAGER">HSEQ manager</option>
                <option value="RISK_MANAGER">Risk manager</option>
                <option value="ADVISOR">Advisor</option>
                <option value="AUDITOR">Auditor</option>
                <option value="READ_ONLY">Read only</option>
              </select>
            </div>
          </div>
          <Button type="submit">Add user</Button>
        </form>
      ) : null}

      {props.canImport ? (
        <form
          className="space-y-3"
          action={async (formData) => {
            const result = await importCompaniesCsv({
              csv: String(formData.get("csv") ?? ""),
              portfolioId: String(formData.get("portfolioId") ?? ""),
              relationshipType: String(formData.get("relationshipType") ?? "INSURED") as never,
            });
            setStatus(
              result.success
                ? `Imported ${result.data.invited} of ${result.data.total} rows.`
                : "error" in result
                  ? result.error
                  : "Import failed.",
            );
          }}
        >
          <h2 className="text-lg font-semibold">Bulk CSV import</h2>
          <p className="text-sm text-muted-foreground">
            Columns: company name, company number, email, portfolio
          </p>
          <select name="portfolioId" className="h-11 rounded-md border bg-transparent px-3 text-sm">
            {props.portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </select>
          <select name="relationshipType" className="h-11 rounded-md border bg-transparent px-3 text-sm">
            <option value="INSURED">Insured</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="GROUP_SUBSIDIARY">Group subsidiary</option>
          </select>
          <textarea
            name="csv"
            required
            className="min-h-32 w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm"
            placeholder={"company name,company number,email,portfolio"}
          />
          <Button type="submit">Import</Button>
        </form>
      ) : null}

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
