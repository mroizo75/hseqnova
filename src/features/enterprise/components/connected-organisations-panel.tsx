"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  respondToEnterpriseConnection,
  shareDocumentWithEnterprise,
  updateMembershipVisibility,
  inviteAdvisorIntoCompany,
  createActionFromImprovementRequest,
} from "@/server/actions/enterprise.actions";
import { ENTERPRISE_DOMAIN_KEYS } from "@/lib/enterprise-visibility";
import { actionMessage } from "@/lib/enterprise-action-result";

type Membership = {
  id: string;
  status: string;
  relationshipType: string;
  shareLossStatistics: boolean;
  programmeName: string;
  organisationName: string;
};

export function ConnectedOrganisationsPanel(props: {
  isAdmin: boolean;
  memberships: Membership[];
  access: Array<{ membershipId: string; domainKey: string; visibilityLevel: string }>;
  documents: Array<{ id: string; title: string }>;
  advisors: Array<{ id: string; name: string }>;
  requests: Array<{ id: string; membershipId: string; title: string; message: string; status: string }>;
}) {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {props.memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">No enterprise organisations are connected to this company.</p>
      ) : null}
      {props.memberships.map((membership) => (
        <div key={membership.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{membership.programmeName || membership.organisationName}</p>
              <p className="text-sm text-muted-foreground">
                {membership.relationshipType.replaceAll("_", " ").toLowerCase()} · {membership.status}
              </p>
            </div>
            {props.isAdmin && (membership.status === "PENDING" || membership.status === "INVITED") ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    const result = await respondToEnterpriseConnection({
                      membershipId: membership.id,
                      accept: true,
                      shareLossStatistics: false,
                    });
                    setStatus(actionMessage(result, "Connection accepted."));
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={async () => {
                    const result = await respondToEnterpriseConnection({
                      membershipId: membership.id,
                      accept: false,
                    });
                    setStatus(actionMessage(result, "Connection declined."));
                  }}
                >
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
          {props.isAdmin && membership.status === "ACTIVE" ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Visibility</p>
              {ENTERPRISE_DOMAIN_KEYS.map((domain) => {
                const current =
                  props.access.find((row) => row.membershipId === membership.id && row.domainKey === domain)
                    ?.visibilityLevel ?? "NONE";
                return (
                  <label key={domain} className="flex items-center justify-between gap-3 text-sm">
                    <span>{domain.replaceAll("_", " ")}</span>
                    <select
                      defaultValue={current}
                      className="h-9 rounded-md border bg-transparent px-2"
                      onChange={async (event) => {
                        const result = await updateMembershipVisibility({
                          membershipId: membership.id,
                          domainKey: domain,
                          visibilityLevel: event.target.value as never,
                        });
                        setStatus(actionMessage(result, "Visibility updated."));
                      }}
                    >
                      <option value="NONE">None</option>
                      <option value="STATUS">Status</option>
                      <option value="AGGREGATED">Aggregated</option>
                      <option value="SHARED_EVIDENCE">Shared evidence</option>
                    </select>
                  </label>
                );
              })}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  defaultChecked={membership.shareLossStatistics}
                  onChange={async (event) => {
                    const result = await updateMembershipVisibility({
                      membershipId: membership.id,
                      domainKey: "INCIDENT_STATS",
                      visibilityLevel: event.target.checked ? "AGGREGATED" : "NONE",
                      shareLossStatistics: event.target.checked,
                    });
                    setStatus(actionMessage(result, "Loss statistics sharing updated."));
                  }}
                />
                Share loss statistics (counts only)
              </label>
              {props.documents.length > 0 ? (
                <form
                  className="flex flex-wrap gap-2"
                  action={async (formData) => {
                    const result = await shareDocumentWithEnterprise({
                      membershipId: membership.id,
                      documentId: String(formData.get("documentId") ?? ""),
                    });
                    setStatus(actionMessage(result, "Document shared."));
                  }}
                >
                  <select name="documentId" className="h-11 flex-1 rounded-md border bg-transparent px-3 text-sm">
                    {props.documents.map((document) => (
                      <option key={document.id} value={document.id}>
                        {document.title}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" className="bg-transparent">
                    Share evidence
                  </Button>
                </form>
              ) : null}
              {props.advisors.length > 0 ? (
                <form
                  className="flex flex-wrap gap-2"
                  action={async (formData) => {
                    const result = await inviteAdvisorIntoCompany({
                      advisorUserId: String(formData.get("advisorUserId") ?? ""),
                      tenantId: "",
                    });
                    setStatus(actionMessage(result, "Advisor invited into this company."));
                  }}
                >
                  <select name="advisorUserId" className="h-11 flex-1 rounded-md border bg-transparent px-3 text-sm">
                    {props.advisors.map((advisor) => (
                      <option key={advisor.id} value={advisor.id}>
                        {advisor.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" className="bg-transparent">
                    Invite advisor to workspace
                  </Button>
                </form>
              ) : null}
              {props.requests.filter((request) => request.membershipId === membership.id).length > 0 ? (
                <p className="text-sm font-medium">Improvement requests</p>
              ) : null}
              {props.requests
                .filter((request) => request.membershipId === membership.id)
                .map((request) => (
                  <form
                    key={request.id}
                    className="space-y-2 rounded-lg border p-3"
                    action={async (formData) => {
                      const result = await createActionFromImprovementRequest({
                        requestId: request.id,
                        title: String(formData.get("title") ?? ""),
                        dueAt: String(formData.get("dueAt") ?? ""),
                      });
                      setStatus(actionMessage(result, "Action created in your HSEQ workspace."));
                    }}
                  >
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.message}</p>
                    <p className="text-xs uppercase text-muted-foreground">{request.status.replaceAll("_", " ")}</p>
                    <Input name="title" placeholder="Action title" required />
                    <Input name="dueAt" type="date" required />
                    <Button type="submit" size="sm">
                      Add action
                    </Button>
                  </form>
                ))}
            </div>
          ) : null}
        </div>
      ))}
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
