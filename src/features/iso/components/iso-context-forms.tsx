"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createIsoContextIssue, createIsoInterestedParty, saveIsoScope } from "@/server/actions/iso.actions";
import type { IsoContextIssueRow, IsoInterestedPartyRow, IsoScopeRow } from "@/server/queries/iso.queries";

export function IsoContextForms({
  issues,
  parties,
  scope,
}: {
  issues: IsoContextIssueRow[];
  parties: IsoInterestedPartyRow[];
  scope: IsoScopeRow | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await createIsoContextIssue({
      kind: form.get("kind"),
      title: form.get("title"),
      description: form.get("description"),
      relevance: form.get("relevance"),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function onParty(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await createIsoInterestedParty({
      name: form.get("name"),
      partyType: form.get("partyType"),
      needs: form.get("needs"),
      expectations: form.get("expectations"),
      consultationMethod: form.get("consultationMethod"),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function onScope(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await saveIsoScope({
      ohAndSScope: form.get("ohAndSScope"),
      qualityScope: form.get("qualityScope"),
      inclusions: form.get("inclusions"),
      exclusions: form.get("exclusions"),
      sites: form.get("sites"),
      approve: form.get("approve") === "on",
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form onSubmit={onIssue} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Add a context issue or opportunity</h2>
        <p className="text-sm text-muted-foreground">ISO 45001 / 9001 cl. 4.1 and 6.1.1.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="kind">Type</Label>
            <select
              id="kind"
              name="kind"
              defaultValue="INTERNAL"
              disabled={busy}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="INTERNAL">Internal issue</option>
              <option value="EXTERNAL">External issue</option>
              <option value="OPPORTUNITY">Opportunity</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required minLength={3} disabled={busy} />
          </div>
        </div>
        <Textarea name="description" placeholder="What is the issue or opportunity?" disabled={busy} />
        <Textarea name="relevance" placeholder="Why it matters for OH&S or quality" disabled={busy} />
        <Button type="submit" disabled={busy}>
          Save issue
        </Button>
        {issues.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {issues.map((issue) => (
              <li key={issue.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">{issue.title}</span>
                <span className="ml-2 text-muted-foreground">{issue.kind.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={onParty} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Add an interested party</h2>
        <p className="text-sm text-muted-foreground">ISO 45001 / 9001 cl. 4.2. Include workers, customers and regulators.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="name" placeholder="Name" required minLength={2} disabled={busy} />
          <select
            name="partyType"
            defaultValue="WORKERS"
            disabled={busy}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="WORKERS">Workers</option>
            <option value="CONTRACTOR">Contractor</option>
            <option value="CUSTOMER">Customer</option>
            <option value="REGULATOR">Regulator (HSE / UKAS)</option>
            <option value="COMMUNITY">Community</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <Textarea name="needs" placeholder="Needs" required minLength={5} disabled={busy} />
        <Textarea name="expectations" placeholder="Expectations" required minLength={5} disabled={busy} />
        <Input name="consultationMethod" placeholder="How you consult or communicate" disabled={busy} />
        <Button type="submit" disabled={busy}>
          Save party
        </Button>
        {parties.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {parties.map((party) => (
              <li key={party.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">{party.name}</span>
                <span className="ml-2 text-muted-foreground">{party.partyType.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={onScope} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">OH&S and quality scope</h2>
        <p className="text-sm text-muted-foreground">ISO 45001 / 9001 cl. 4.3. Approve when it is ready for the auditor.</p>
        <Label htmlFor="ohAndSScope">OH&S scope</Label>
        <Textarea
          id="ohAndSScope"
          name="ohAndSScope"
          required
          minLength={20}
          rows={4}
          defaultValue={scope?.ohAndSScope ?? ""}
          disabled={busy}
        />
        <Label htmlFor="qualityScope">Quality scope</Label>
        <Textarea
          id="qualityScope"
          name="qualityScope"
          rows={3}
          defaultValue={scope?.qualityScope ?? ""}
          disabled={busy}
        />
        <Textarea name="sites" placeholder="Sites and locations" defaultValue={scope?.sites ?? ""} disabled={busy} />
        <Textarea name="inclusions" placeholder="Inclusions" defaultValue={scope?.inclusions ?? ""} disabled={busy} />
        <Textarea name="exclusions" placeholder="Exclusions and justification" defaultValue={scope?.exclusions ?? ""} disabled={busy} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="approve" />
          Approve this scope
        </label>
        <Button type="submit" disabled={busy}>
          Save scope
        </Button>
        {scope?.approvedAt ? (
          <p className="text-sm text-muted-foreground">Approved {scope.approvedAt.toLocaleDateString("en-GB")}.</p>
        ) : null}
      </form>
    </div>
  );
}
