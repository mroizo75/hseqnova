"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeFireRiskAssessment } from "@/server/actions/fire-risk.actions";

export function CompleteFireRiskButton({ id }: { id: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onComplete() {
    setSaving(true);
    setError(null);
    const result = await completeFireRiskAssessment(id);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void onComplete()} disabled={saving}>
        {saving ? "Recording…" : "Mark as recorded"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
