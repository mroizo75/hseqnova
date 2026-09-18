"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createIsoChange, setIsoChangeStatus } from "@/server/actions/iso.actions";
import type { IsoChangeRow } from "@/server/queries/iso.queries";

const NEXT: Record<string, string> = {
  PROPOSED: "ASSESSED",
  ASSESSED: "APPROVED",
  APPROVED: "IMPLEMENTED",
  IMPLEMENTED: "CLOSED",
};

export function ChangeRegisterClient({ items }: { items: IsoChangeRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await createIsoChange({
      title: form.get("title"),
      description: form.get("description"),
      changeType: form.get("changeType"),
      riskImpact: form.get("riskImpact"),
      trainingImpact: form.get("trainingImpact"),
      documentImpact: form.get("documentImpact"),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function advance(id: string, status: string) {
    const next = NEXT[status];
    if (!next) return;
    setBusy(true);
    await setIsoChangeStatus(id, next);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <form onSubmit={onCreate} className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">Record a planned change</h2>
        <p className="text-sm text-muted-foreground">
          ISO 45001 cl. 8.1.3 — assess risk, training and documents before you implement.
        </p>
        <Input name="title" placeholder="What is changing?" required disabled={busy} />
        <select
          name="changeType"
          defaultValue="PROCESS"
          disabled={busy}
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="PROCESS">Process</option>
          <option value="PLANT">Plant / equipment</option>
          <option value="ORGANISATION">Organisation</option>
          <option value="LEGAL">Legal / other requirement</option>
          <option value="OTHER">Other</option>
        </select>
        <Textarea name="description" placeholder="Description" required minLength={10} disabled={busy} />
        <Textarea name="riskImpact" placeholder="Effect on risk assessments" disabled={busy} />
        <Textarea name="trainingImpact" placeholder="Effect on competence" disabled={busy} />
        <Textarea name="documentImpact" placeholder="Documents to update" disabled={busy} />
        <Button type="submit" disabled={busy}>
          Save change
        </Button>
      </form>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{item.title}</p>
              <span className="text-sm text-muted-foreground">{item.status.toLowerCase()}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            {NEXT[item.status] ? (
              <Button
                className="mt-3"
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => advance(item.id, item.status)}
              >
                Mark as {NEXT[item.status].toLowerCase()}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
