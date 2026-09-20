import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsultationClient } from "@/features/iso/components/consultation-client";
import type { IsoConsultationHub } from "@/server/queries/iso.queries";

const INCIDENT_LABEL: Record<string, string> = {
  NESTEN: "Near miss",
  FARLIG_SITUASJON: "Hazard / unsafe condition",
  AVVIK: "Incident",
  ULYKKE: "Accident",
  YRKESSYKDOM: "Occupational disease",
};

export function IsoConsultationHubView({ hub }: { hub: IsoConsultationHub }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Worker consultation is the chain employee → issue → action → closure. Meetings, near misses, hazards and
        whistleblowing (PIDA) are evidence for ISO 45001 5.4 / 7.4 — not a separate silo.
      </p>
      <ConsultationClient items={hub.meetings} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issues raised</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {hub.incidents.length === 0 ? (
              <p className="text-muted-foreground">No accident-book entries yet.</p>
            ) : (
              hub.incidents.slice(0, 12).map((item) => (
                <div key={item.id} className="flex justify-between gap-2 border-b py-1 last:border-0">
                  <div>
                    <Link className="underline underline-offset-2" href={`/dashboard/incidents/${item.id}`}>
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {INCIDENT_LABEL[item.type] ?? item.type} · {item.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions and closure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {hub.actions.length === 0 ? (
              <p className="text-muted-foreground">No actions linked to incidents yet.</p>
            ) : (
              hub.actions.slice(0, 12).map((item) => (
                <div key={item.id} className="border-b py-1 last:border-0">
                  <Link className="underline underline-offset-2" href="/dashboard/actions">
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {item.status}
                    {item.effectiveness ? ` · effectiveness ${item.effectiveness}` : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Whistleblowing (PIDA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {hub.whistleblowing.length === 0 ? (
            <p className="text-muted-foreground">
              No whistleblowing cases. The channel is still evidence that workers can raise concerns.
            </p>
          ) : (
            hub.whistleblowing.map((item) => (
              <div key={item.id} className="flex justify-between border-b py-1 last:border-0">
                <span>
                  {item.caseNumber} — {item.isAnonymous ? "Anonymous case" : item.title}
                </span>
                <span className="text-muted-foreground">{item.status}</span>
              </div>
            ))
          )}
          <Link className="inline-block underline underline-offset-2" href="/dashboard/whistleblowing">
            Open whistleblowing
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
