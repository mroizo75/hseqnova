"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { syncInvoicesWithFiken } from "@/server/actions/invoice.actions";
import { useRouter } from "next/navigation";

export function SyncInvoicesButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await syncInvoicesWithFiken();
      if (result.success) {
        alert(`Synkronisert: ${result.updated} oppdatert, ${result.reactivated} reaktivert`);
        router.refresh();
      } else {
        alert(`Feil: ${result.error}`);
      }
    } catch (error) {
      alert("Noe gikk galt ved synkronisering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={loading}>
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Synkroniserer..." : "Synkroniser med Fiken"}
    </Button>
  );
}

