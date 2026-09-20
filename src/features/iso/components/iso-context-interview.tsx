"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createIsoContextIssue,
  createIsoInterestedParty,
  saveIsoScope,
} from "@/server/actions/iso.actions";
import type { IsoScopeRow } from "@/server/queries/iso.queries";

const STEPS = [
  "What the company does",
  "Who can be harmed",
  "Contractors and other parties",
  "Laws and significant risks",
  "Approve the scope",
] as const;

export function IsoContextInterview({ scope }: { scope: IsoScopeRow | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submitStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    let result: { success: true } | { success: false; error: string };
    if (step === 0) {
      result = await createIsoContextIssue({
        kind: "INTERNAL",
        title: form.get("title"),
        description: form.get("description"),
        relevance: "Recorded in the first meeting (ISO 45001/9001 4.1).",
      });
    } else if (step === 1) {
      result = await createIsoInterestedParty({
        name: form.get("name"),
        partyType: "WORKERS",
        needs: form.get("needs"),
        expectations: form.get("expectations"),
        consultationMethod: form.get("consultationMethod"),
      });
    } else if (step === 2) {
      result = await createIsoInterestedParty({
        name: form.get("name"),
        partyType: form.get("partyType"),
        needs: form.get("needs"),
        expectations: form.get("expectations"),
        consultationMethod: form.get("consultationMethod"),
      });
    } else if (step === 3) {
      result = await createIsoContextIssue({
        kind: "EXTERNAL",
        title: form.get("title"),
        description: form.get("description"),
        relevance: form.get("relevance"),
      });
    } else {
      result = await saveIsoScope({
        ohAndSScope: form.get("ohAndSScope"),
        qualityScope: form.get("qualityScope"),
        inclusions: form.get("inclusions"),
        exclusions: form.get("exclusions"),
        sites: form.get("sites"),
        approve: true,
      });
    }

    setBusy(false);
    if (result.success === false) {
      setError(result.error);
      return;
    }
    if (step === STEPS.length - 1) {
      setDone(true);
      router.refresh();
      return;
    }
    setStep((current) => current + 1);
    event.currentTarget.reset();
    router.refresh();
  }

  if (done) {
    return (
      <Card className="border-teal-200">
        <CardContent className="py-6">
          <p className="font-medium">First meeting recorded.</p>
          <p className="text-sm text-muted-foreground">
            Context, interested parties and an approved scope are now on file. Context can turn green once the other
            clause 4 records are complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>First meeting — context interview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}. Answers write into the same registers the auditor will open.
        </p>
      </CardHeader>
      <CardContent>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <form onSubmit={submitStep} className="space-y-3">
          {step === 0 ? (
            <>
              <Label htmlFor="title">What does the company do?</Label>
              <Input id="title" name="title" required minLength={3} placeholder="e.g. Electrical contracting on occupied sites" />
              <Label htmlFor="description">Internal issues that affect health and safety</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Competence, ageing plant, multi-site work..." />
            </>
          ) : null}
          {step === 1 ? (
            <>
              <Label htmlFor="name">Who can be harmed?</Label>
              <Input id="name" name="name" required minLength={2} defaultValue="Workers" />
              <Label htmlFor="needs">Needs</Label>
              <Textarea id="needs" name="needs" required minLength={5} rows={2} />
              <Label htmlFor="expectations">Expectations</Label>
              <Textarea id="expectations" name="expectations" required minLength={5} rows={2} />
              <Label htmlFor="consultationMethod">How they are consulted</Label>
              <Input id="consultationMethod" name="consultationMethod" placeholder="Toolbox talks, safety representatives, meetings" />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Label htmlFor="name">Other interested party</Label>
              <Input id="name" name="name" required minLength={2} placeholder="Principal contractor, HSE, neighbours..." />
              <Label htmlFor="partyType">Type</Label>
              <select name="partyType" className="h-9 w-full rounded-md border bg-transparent px-2 text-sm" defaultValue="CONTRACTOR">
                <option value="CONTRACTOR">Contractor</option>
                <option value="CUSTOMER">Customer</option>
                <option value="REGULATOR">Regulator</option>
                <option value="COMMUNITY">Community</option>
                <option value="OTHER">Other</option>
              </select>
              <Label htmlFor="needs">Needs</Label>
              <Textarea id="needs" name="needs" required minLength={5} rows={2} />
              <Label htmlFor="expectations">Expectations</Label>
              <Textarea id="expectations" name="expectations" required minLength={5} rows={2} />
              <Input name="consultationMethod" placeholder="How you communicate with them" />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <Label htmlFor="title">Significant external issue, law or risk theme</Label>
              <Input id="title" name="title" required minLength={3} placeholder="e.g. CDM 2015 on occupied sites" />
              <Label htmlFor="description">Why it matters</Label>
              <Textarea id="description" name="description" rows={3} />
              <Label htmlFor="relevance">Relevance to the OH&S / quality system</Label>
              <Textarea id="relevance" name="relevance" rows={2} />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Scope must be approved before the Context phase can turn green. Write what the management system covers.
              </p>
              <Label htmlFor="ohAndSScope">OH&S scope *</Label>
              <Textarea
                id="ohAndSScope"
                name="ohAndSScope"
                required
                minLength={20}
                rows={4}
                defaultValue={scope?.ohAndSScope ?? ""}
              />
              <Label htmlFor="qualityScope">Quality scope</Label>
              <Textarea id="qualityScope" name="qualityScope" rows={3} defaultValue={scope?.qualityScope ?? ""} />
              <Label htmlFor="sites">Sites</Label>
              <Input id="sites" name="sites" defaultValue={scope?.sites ?? ""} />
              <Label htmlFor="inclusions">Inclusions</Label>
              <Textarea id="inclusions" name="inclusions" rows={2} defaultValue={scope?.inclusions ?? ""} />
              <Label htmlFor="exclusions">Exclusions (justify)</Label>
              <Textarea id="exclusions" name="exclusions" rows={2} defaultValue={scope?.exclusions ?? ""} />
            </>
          ) : null}
          <div className="flex gap-2 pt-2">
            {step > 0 ? (
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : step === STEPS.length - 1 ? "Save and approve scope" : "Save and continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
