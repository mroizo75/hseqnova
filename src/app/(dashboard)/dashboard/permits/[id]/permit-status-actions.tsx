"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePermitStatus } from "@/server/actions/permit-to-work.actions";
import { PermitToWorkStatus } from "@prisma/client";

interface PermitStatusActionsProps {
  permitId: string;
  currentStatus: PermitToWorkStatus;
}

const TRANSITIONS: Record<
  PermitToWorkStatus,
  { label: string; target: PermitToWorkStatus; variant: "default" | "destructive" | "outline" }[]
> = {
  DRAFT: [
    { label: "Issue permit", target: PermitToWorkStatus.ISSUED, variant: "default" },
    { label: "Cancel", target: PermitToWorkStatus.CANCELLED, variant: "destructive" },
  ],
  ISSUED: [
    { label: "Close permit", target: PermitToWorkStatus.CLOSED, variant: "outline" },
    { label: "Cancel", target: PermitToWorkStatus.CANCELLED, variant: "destructive" },
  ],
  CLOSED: [],
  CANCELLED: [],
};

export function PermitStatusActions({ permitId, currentStatus }: PermitStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuerName, setIssuerName] = useState("");
  const [acceptorName, setAcceptorName] = useState("");
  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  async function handleTransition(target: PermitToWorkStatus) {
    setError(null);
    setLoading(true);
    try {
      const result = await updatePermitStatus({
        id: permitId,
        status: target,
        issuerName: target === "ISSUED" ? issuerName : undefined,
        acceptorName: target === "ISSUED" ? acceptorName : undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update the permit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {currentStatus === "DRAFT" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="issuerName" className="text-sm">
              Issued by *
            </Label>
            <Input
              id="issuerName"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              placeholder="Who authorises this permit"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acceptorName" className="text-sm">
              Person in charge of the work *
            </Label>
            <Input
              id="acceptorName"
              value={acceptorName}
              onChange={(e) => setAcceptorName(e.target.value)}
              placeholder="Who accepts the permit"
            />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        {transitions.map((t) => (
          <Button
            key={t.target}
            variant={t.variant}
            size="sm"
            disabled={loading}
            onClick={() => handleTransition(t.target)}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
