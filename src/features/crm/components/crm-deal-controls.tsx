"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateCrmDealDetails, updateCrmDealStage } from "@/server/actions/crm.actions";
import { CRM_DEAL_STAGES } from "@/features/crm/lib/types";
import { CRM_STAGE_LABELS } from "@/features/crm/lib/labels";

export function CrmDealControls({
  dealId,
  stage,
  valueGbp,
  expectedCloseAt,
  title,
}: {
  dealId: string;
  stage: (typeof CRM_DEAL_STAGES)[number];
  valueGbp: number;
  expectedCloseAt: string | null;
  title: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const saveDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setLoading(true);
    const result = await updateCrmDealDetails({
      dealId,
      title: String(data.get("title") ?? title),
      valueGbp: Number(data.get("valueGbp") ?? 0),
      expectedCloseAt: String(data.get("expectedCloseAt") ?? "") || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not save deal", description: result.error });
      return;
    }
    toast({ title: "Deal updated" });
    router.refresh();
  };

  const moveStage = async (nextStage: (typeof CRM_DEAL_STAGES)[number]) => {
    let lostReason: string | undefined;
    if (nextStage === "LOST") {
      lostReason = window.prompt("Why was this deal lost?")?.trim();
      if (!lostReason) return;
    }
    setLoading(true);
    const result = await updateCrmDealStage({ dealId, stage: nextStage, lostReason });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not change stage", description: result.error });
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={saveDetails} className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1 md:col-span-3">
          <Label htmlFor="title">Deal title</Label>
          <Input id="title" name="title" defaultValue={title} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="valueGbp">Value (GBP)</Label>
          <Input id="valueGbp" name="valueGbp" type="number" min="0" step="1" defaultValue={valueGbp} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="expectedCloseAt">Expected close</Label>
          <Input
            id="expectedCloseAt"
            name="expectedCloseAt"
            type="date"
            defaultValue={expectedCloseAt ? expectedCloseAt.slice(0, 10) : ""}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            Save deal
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {CRM_DEAL_STAGES.map((item) => (
          <Button
            key={item}
            type="button"
            variant={item === stage ? "default" : "outline"}
            size="sm"
            className={item === stage ? undefined : "bg-transparent"}
            disabled={loading || item === stage}
            onClick={() => moveStage(item)}
          >
            {CRM_STAGE_LABELS[item]}
          </Button>
        ))}
      </div>
    </div>
  );
}
