"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { importRecordShare } from "@/server/actions/record-share.actions";

export function ImportSharedRecordButton({ token, disabled }: { token: string; disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      const result = await importRecordShare(token);
      if ("error" in result) {
        toast({ variant: "destructive", title: "Could not import", description: result.error });
        return;
      }
      toast({ title: "Imported", description: "The record is now in this organisation." });
      router.push(result.data.href);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" onClick={handleImport} disabled={disabled || loading}>
      {loading ? "Importing…" : "Import into this organisation"}
    </Button>
  );
}
