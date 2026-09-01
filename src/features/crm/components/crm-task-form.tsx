"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { completeCrmTask, createCrmTask } from "@/server/actions/crm.actions";

export function CrmTaskForm({
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
    const result = await createCrmTask({
      organisationId,
      dealId,
      title: String(data.get("title") ?? ""),
      dueAt: String(data.get("dueAt") ?? "") || undefined,
    });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not create task", description: result.error });
      return;
    }
    form.reset();
    toast({ title: "Task created" });
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <div className="space-y-1">
        <Label htmlFor="title">Follow-up</Label>
        <Input id="title" name="title" required placeholder="Call the safety manager" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dueAt">Due</Label>
        <Input id="dueAt" name="dueAt" type="date" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Add task"}
        </Button>
      </div>
    </form>
  );
}

export function CrmCompleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="bg-transparent"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const result = await completeCrmTask(taskId);
        setLoading(false);
        if (!result.success) {
          toast({ variant: "destructive", title: "Could not complete task", description: result.error });
          return;
        }
        router.refresh();
      }}
    >
      {loading ? "…" : "Done"}
    </Button>
  );
}
