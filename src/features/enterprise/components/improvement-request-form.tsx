"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createImprovementRequest } from "@/server/actions/enterprise.actions";

export function ImprovementRequestForm({ membershipId }: { membershipId: string }) {
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    const result = await createImprovementRequest({
      membershipId,
      title: String(formData.get("title") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
    setStatus(result.success ? "Improvement plan requested." : "error" in result ? result.error : "Saved.");
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="title">Request title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">What should improve</Label>
        <textarea
          id="message"
          name="message"
          required
          className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit">Request improvement plan</Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </form>
  );
}
