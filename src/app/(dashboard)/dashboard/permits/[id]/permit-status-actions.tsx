"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updatePermitStatus } from "@/server/actions/permit-to-work.actions";
import { PermitToWorkStatus } from "@prisma/client";

interface PermitStatusActionsProps {
  permitId: string;
  currentStatus: PermitToWorkStatus;
}

const TRANSITIONS: Record<PermitToWorkStatus, { label: string; target: PermitToWorkStatus; variant: "default" | "destructive" | "outline" }[]> = {
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
  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  async function handleTransition(target: PermitToWorkStatus) {
    setLoading(true);
    try {
      await updatePermitStatus(permitId, target);
      router.refresh();
    } catch {
      // Error handled silently — page refresh shows current state
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
