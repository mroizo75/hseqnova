"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createIsoProcess, recordIsoCustomerFeedback, removeIsoProcess } from "@/server/actions/iso.actions";
import type { IsoProcessRow, IsoTenantMember } from "@/server/queries/iso.queries";

export function IsoQmsOperations({
  processes,
  feedback,
  members,
}: {
  processes: IsoProcessRow[];
  feedback: Array<{
    id: string;
    summary: string;
    sentiment: string;
    customerCompany: string | null;
    recordedAt: Date | null;
  }>;
  members: IsoTenantMember[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>QMS processes (ISO 9001 4.4)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Name the processes that deliver the work and how they interact. The auditor asks for this before looking at
            files.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {processes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No processes named yet. Start with enquiry-to-order and delivery/handover.</p>
          ) : (
            <ul className="space-y-2">
              {processes.map((process) => (
                <li key={process.id} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                  <div>
                    <p className="font-medium">{process.name}</p>
                    <p className="text-sm text-muted-foreground">{process.purpose}</p>
                    <p className="text-xs text-muted-foreground">
                      In: {process.inputs || "—"} · Out: {process.outputs || "—"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      const result = await removeIsoProcess(process.id);
                      setBusy(false);
                      if (result.success === false) {
                        setError(result.error);
                        return;
                      }
                      router.refresh();
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              const data = new FormData(event.currentTarget);
              const result = await createIsoProcess({
                name: data.get("name"),
                purpose: data.get("purpose"),
                ownerId: String(data.get("ownerId") ?? "") || undefined,
                inputs: data.get("inputs"),
                outputs: data.get("outputs"),
              });
              setBusy(false);
              if (result.success === false) {
                setError(result.error);
                return;
              }
              event.currentTarget.reset();
              router.refresh();
            }}
          >
            <div className="md:col-span-2">
              <Label htmlFor="name">Process name</Label>
              <Input id="name" name="name" required minLength={3} placeholder="e.g. Enquiry to order" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea id="purpose" name="purpose" required minLength={8} rows={2} />
            </div>
            <div>
              <Label htmlFor="inputs">Inputs</Label>
              <Input id="inputs" name="inputs" placeholder="Customer specification, drawings" />
            </div>
            <div>
              <Label htmlFor="outputs">Outputs</Label>
              <Input id="outputs" name="outputs" placeholder="Confirmed order, RAMS, handover" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="ownerId">Owner</Label>
              <select id="ownerId" name="ownerId" className="mt-1 h-9 w-full rounded-md border bg-transparent px-2 text-sm">
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={busy}>
              Add process
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer perception (ISO 9001 9.1.2)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record how customers see the work — not a marketing survey. A complaint, thank-you or handover comment is
            enough if you record what you did.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customer feedback recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {feedback.map((item) => (
                <li key={item.id} className="rounded-md border px-3 py-2">
                  <p className="font-medium">
                    {item.sentiment} {item.customerCompany ? `· ${item.customerCompany}` : ""}
                  </p>
                  <p className="text-muted-foreground">{item.summary}</p>
                </li>
              ))}
            </ul>
          )}
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              const data = new FormData(event.currentTarget);
              const result = await recordIsoCustomerFeedback({
                summary: data.get("summary"),
                customerCompany: data.get("customerCompany"),
                sentiment: data.get("sentiment"),
                source: data.get("source"),
              });
              setBusy(false);
              if (result.success === false) {
                setError(result.error);
                return;
              }
              event.currentTarget.reset();
              router.refresh();
            }}
          >
            <Label htmlFor="summary">What the customer said</Label>
            <Textarea id="summary" name="summary" required minLength={5} rows={3} />
            <div className="grid gap-3 md:grid-cols-3">
              <Input name="customerCompany" placeholder="Customer / principal contractor" />
              <select name="sentiment" className="h-9 rounded-md border bg-transparent px-2 text-sm" defaultValue="NEUTRAL">
                <option value="POSITIVE">Positive</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="NEGATIVE">Negative</option>
              </select>
              <select name="source" className="h-9 rounded-md border bg-transparent px-2 text-sm" defaultValue="OTHER">
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
                <option value="MEETING">Meeting</option>
                <option value="SURVEY">Survey</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <Button type="submit" disabled={busy}>
              Record feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
