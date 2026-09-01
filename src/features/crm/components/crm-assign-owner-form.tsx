"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { assignCrmOwner } from "@/server/actions/crm.actions";

export function CrmAssignOwnerForm({
  organisationId,
  dealId,
  currentOwnerId,
  salespeople,
}: {
  organisationId: string;
  dealId?: string;
  currentOwnerId: string | null;
  salespeople: Array<{ id: string; name: string | null; email: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ownerId = String(new FormData(event.currentTarget).get("ownerId") ?? "") || null;
    setLoading(true);
    const result = await assignCrmOwner({ organisationId, dealId, ownerId });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not assign", description: result.error });
      return;
    }
    toast({ title: ownerId ? "Owner assigned" : "Owner cleared" });
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="ownerId">Sales owner</Label>
        <select
          id="ownerId"
          name="ownerId"
          defaultValue={currentOwnerId ?? ""}
          className="flex h-10 min-w-[16rem] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {salespeople.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name || person.email}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Assign"}
      </Button>
    </form>
  );
}
