"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMyAssignedMeasure } from "@/server/actions/measure.actions";
import { useToast } from "@/hooks/use-toast";
import type { ActionStatus } from "@prisma/client";

interface EmployeeActionUpdateProps {
  measureId: string;
  status: ActionStatus;
}

export function EmployeeActionUpdate({ measureId, status }: EmployeeActionUpdateProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"IN_PROGRESS" | "DONE" | null>(null);

  if (status === "DONE") return null;

  const run = async (nextStatus: "IN_PROGRESS" | "DONE") => {
    setLoading(nextStatus);
    try {
      const result = await updateMyAssignedMeasure({
        id: measureId,
        status: nextStatus,
        completionNote: nextStatus === "DONE" ? note : undefined,
      });
      if (result.success) {
        toast({
          title: nextStatus === "DONE" ? "Action closed" : "Action started",
          description:
            nextStatus === "DONE"
              ? "What you did has been recorded"
              : "Mark it complete when the work is done",
          className: "bg-green-50 border-green-200",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not update the action",
          description: result.error,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <Label htmlFor={`done-note-${measureId}`} className="text-xs">
        What was done (required to close)
      </Label>
      <Textarea
        id={`done-note-${measureId}`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        disabled={loading !== null}
        placeholder="e.g. Guardrail fitted on the north roof edge on 31 Aug"
      />
      <div className="flex flex-wrap gap-2">
        {status === "PENDING" || status === "OVERDUE" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-transparent"
            disabled={loading !== null}
            onClick={() => void run("IN_PROGRESS")}
          >
            {loading === "IN_PROGRESS" ? "Starting..." : "Start"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={loading !== null}
          onClick={() => void run("DONE")}
        >
          {loading === "DONE" ? "Closing..." : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}
