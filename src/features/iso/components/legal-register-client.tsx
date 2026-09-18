"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createIsoLegalRequirement,
  evaluateLegalRequirement,
  seedIsoLegalRegister,
} from "@/server/actions/iso.actions";
import type { IsoLegalRequirementRow } from "@/server/queries/iso.queries";

export function LegalRegisterClient({ items }: { items: IsoLegalRequirementRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    const result = await seedIsoLegalRegister();
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await createIsoLegalRequirement({
      title: form.get("title"),
      source: form.get("source"),
      reference: form.get("reference"),
      appliesBecause: form.get("appliesBecause"),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function onEval(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const result = await evaluateLegalRequirement({
      id,
      result: form.get("result"),
      notes: form.get("notes"),
      nextEvaluationDate: form.get("nextEvaluationDate"),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {items.length === 0 ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Start with the core UK duties this company almost certainly has, then add your own.
          </p>
          <Button className="mt-3" type="button" onClick={seed} disabled={busy}>
            Add HSWA, MHSWR, RIDDOR and ISO
          </Button>
        </div>
      ) : null}

      <form onSubmit={onCreate} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Add a legal or other requirement</h2>
        <Input name="title" placeholder="Title" required disabled={busy} />
        <div className="grid gap-3 md:grid-cols-2">
          <Input name="source" placeholder="Source (HSWA 1974, customer contract…)" required disabled={busy} />
          <Input name="reference" placeholder="Section / clause" disabled={busy} />
        </div>
        <Textarea name="appliesBecause" placeholder="Why it applies to this organisation" disabled={busy} />
        <Button type="submit" disabled={busy}>
          Save requirement
        </Button>
      </form>

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.source}
              {item.reference ? ` — ${item.reference}` : ""}
            </p>
            {item.lastEvaluationResult ? (
              <p className="mt-1 text-sm">
                Last evaluation: {item.lastEvaluationResult.toLowerCase().replaceAll("_", " ")}
                {item.lastEvaluationDate
                  ? ` (${item.lastEvaluationDate.toLocaleDateString("en-GB")})`
                  : ""}
              </p>
            ) : null}
            <form onSubmit={(e) => onEval(e, item.id)} className="mt-3 grid gap-2 md:grid-cols-4">
              <select
                name="result"
                defaultValue="COMPLIANT"
                disabled={busy}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="COMPLIANT">Compliant</option>
                <option value="PARTIAL">Partial</option>
                <option value="NON_COMPLIANT">Non-compliant</option>
              </select>
              <Input type="date" name="nextEvaluationDate" disabled={busy} />
              <Input name="notes" placeholder="Notes / evidence" disabled={busy} />
              <Button type="submit" variant="outline" disabled={busy}>
                Record evaluation
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
