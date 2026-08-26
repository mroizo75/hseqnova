"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";

export function ActivateTavleAddonButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function activate() {
    setLoading(true);
    try {
      const res = await fetch("/api/hms-tavle/subscription/addon", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not activate the add-on");
      toast.success("Digital safety board add-on is on. It will appear on the next invoice.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not activate the add-on");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={activate} disabled={loading}>
      <Zap className="mr-2 h-4 w-4" />
      {loading ? "Activating…" : "Activate add-on"}
    </Button>
  );
}
