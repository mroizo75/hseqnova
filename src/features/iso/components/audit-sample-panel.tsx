"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IsoAuditSamplePool } from "@/server/queries/iso.queries";

export function AuditSamplePanel({ samples }: { samples: IsoAuditSamplePool }) {
  const incidentSample = samples.incidents.slice(0, 3);
  const riskSample = samples.risks.slice(0, 3);
  const trainingSample = samples.trainings.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Live record sample</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sample three incidents, three risks and competence records. Check investigation, root cause, action, owner and
          close-out — then record the finding against the clause and the live record.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3 text-sm">
        <SampleList
          title="Incidents"
          empty="No incidents to sample"
          items={incidentSample.map((item) => ({
            id: item.id,
            label: item.title,
            detail: `${item.type} · ${item.status}${item.rootCause ? " · root cause recorded" : " · no root cause"}${item.closedAt ? " · closed" : ""}`,
          }))}
        />
        <SampleList
          title="Risks"
          empty="No risk assessments to sample"
          items={riskSample.map((item) => ({ id: item.id, label: item.title, detail: "Check hierarchy of controls" }))}
        />
        <SampleList
          title="Competence"
          empty="No training records to sample"
          items={trainingSample.map((item) => ({
            id: item.id,
            label: item.title,
            detail: item.validUntil ? `Valid until ${item.validUntil.toISOString().slice(0, 10)}` : "No expiry",
          }))}
        />
      </CardContent>
    </Card>
  );
}

function SampleList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; label: string; detail: string }>;
}) {
  return (
    <div>
      <p className="font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <p>{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
