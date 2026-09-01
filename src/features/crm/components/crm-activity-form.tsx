"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logCrmActivity } from "@/server/actions/crm.actions";
import { CRM_ACTIVITY_TYPES, CRM_ACTIVITY_CHANNELS } from "@/features/crm/lib/types";
import { CRM_ACTIVITY_TYPE_LABELS, CRM_ACTIVITY_CHANNEL_LABELS } from "@/features/crm/lib/labels";

export function CrmActivityForm({
  organisationId,
  dealId,
}: {
  organisationId: string;
  dealId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    const result = await logCrmActivity({
      organisationId,
      dealId,
      type: data.get("type") as (typeof CRM_ACTIVITY_TYPES)[number],
      channel: data.get("channel") as (typeof CRM_ACTIVITY_CHANNELS)[number],
      note: String(data.get("note") ?? ""),
    });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not save activity", description: result.error });
      return;
    }
    form.reset();
    toast({ title: "Activity logged" });
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            defaultValue="FOLLOW_UP"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            {CRM_ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {CRM_ACTIVITY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="channel">Channel</Label>
          <select
            id="channel"
            name="channel"
            defaultValue="EMAIL"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            {CRM_ACTIVITY_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {CRM_ACTIVITY_CHANNEL_LABELS[channel]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" required minLength={2} rows={3} placeholder="What happened?" />
      </div>
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? "Saving…" : "Log activity"}
      </Button>
    </form>
  );
}
