"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateTrainingFollowUpSetting } from "@/server/actions/training-sales.actions";
import { MAX_FOLLOW_UP_MONTHS, MIN_FOLLOW_UP_MONTHS } from "@/features/training-sales/lib/follow-up";

export function TrainingFollowUpSettingForm({ months }: { months: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const monthsValue = Number(new FormData(event.currentTarget).get("months"));
    const result = await updateTrainingFollowUpSetting({ months: monthsValue });
    setLoading(false);
    if (!result.success || !result.data) {
      toast({ variant: "destructive", title: "Could not save the setting", description: result.error });
      return;
    }
    const skipped = result.data.skipped > 0 ? ` ${result.data.skipped} bookings were left as they are because the competence period is shorter than this lead time.` : "";
    toast({
      title: "Lead time saved",
      description: `${result.data.updated} open bookings now contact the customer ${monthsValue} months before expiry.${skipped}`,
    });
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="trainingFollowUpMonths">Months before competence expires</Label>
        <Input
          id="trainingFollowUpMonths"
          name="months"
          type="number"
          min={MIN_FOLLOW_UP_MONTHS}
          max={MAX_FOLLOW_UP_MONTHS}
          required
          defaultValue={months}
          className="w-32"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save lead time"}
      </Button>
    </form>
  );
}
