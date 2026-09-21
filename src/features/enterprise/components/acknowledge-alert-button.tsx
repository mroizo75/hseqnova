"use client";

import { Button } from "@/components/ui/button";
import { acknowledgeEnterpriseAlert } from "@/server/actions/enterprise.actions";

export function AcknowledgeAlertButton({ id, canManage }: { id: string; canManage: boolean }) {
  if (!canManage) return null;
  return (
    <form
      action={async () => {
        await acknowledgeEnterpriseAlert(id);
      }}
    >
      <Button type="submit" variant="outline" size="sm" className="bg-transparent">
        Acknowledge
      </Button>
    </form>
  );
}
