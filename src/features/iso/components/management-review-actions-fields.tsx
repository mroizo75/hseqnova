"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ManagementReviewActionItem } from "@/features/iso/lib/iso-93";

export function ManagementReviewActionsFields({
  users,
  decisions,
  actionPlan,
  onChange,
}: {
  users: Array<{ id: string; name: string | null; email: string }>;
  decisions: ManagementReviewActionItem[];
  actionPlan: ManagementReviewActionItem[];
  onChange: (next: { decisions: ManagementReviewActionItem[]; actionPlan: ManagementReviewActionItem[] }) => void;
}) {
  function update(
    key: "decisions" | "actionPlan",
    index: number,
    patch: Partial<ManagementReviewActionItem>,
  ) {
    const list = key === "decisions" ? [...decisions] : [...actionPlan];
    list[index] = { ...list[index], ...patch };
    onChange({
      decisions: key === "decisions" ? list : decisions,
      actionPlan: key === "actionPlan" ? list : actionPlan,
    });
  }

  function add(key: "decisions" | "actionPlan") {
    const item = { title: "", ownerId: users[0]?.id ?? "", dueDate: "" };
    onChange({
      decisions: key === "decisions" ? [...decisions, item] : decisions,
      actionPlan: key === "actionPlan" ? [...actionPlan, item] : actionPlan,
    });
  }

  function remove(key: "decisions" | "actionPlan", index: number) {
    onChange({
      decisions: key === "decisions" ? decisions.filter((_, i) => i !== index) : decisions,
      actionPlan: key === "actionPlan" ? actionPlan.filter((_, i) => i !== index) : actionPlan,
    });
  }

  return (
    <div className="space-y-6">
      <ActionList
        title="Decisions"
        hint="Record decisions from the review. Each row can become an action."
        items={decisions}
        users={users}
        onAdd={() => add("decisions")}
        onChange={(index, patch) => update("decisions", index, patch)}
        onRemove={(index) => remove("decisions", index)}
      />
      <ActionList
        title="Action plan"
        hint="ISO 9.3 outputs become tracked actions with an owner and due date."
        items={actionPlan}
        users={users}
        onAdd={() => add("actionPlan")}
        onChange={(index, patch) => update("actionPlan", index, patch)}
        onRemove={(index) => remove("actionPlan", index)}
      />
    </div>
  );
}

function ActionList({
  title,
  hint,
  items,
  users,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  hint: string;
  items: ManagementReviewActionItem[];
  users: Array<{ id: string; name: string | null; email: string }>;
  onAdd: () => void;
  onChange: (index: number, patch: Partial<ManagementReviewActionItem>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {items.map((item, index) => (
        <div key={`${title}-${index}`} className="grid gap-2 md:grid-cols-[1fr_180px_150px_auto]">
          <Input
            value={item.title}
            onChange={(event) => onChange(index, { title: event.target.value })}
            placeholder="Decision or action"
          />
          <select
            className="h-9 rounded-md border bg-transparent px-2 text-sm"
            value={item.ownerId}
            onChange={(event) => onChange(index, { ownerId: event.target.value })}
          >
            <option value="">Owner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={item.dueDate ?? ""}
            onChange={(event) => onChange(index, { dueDate: event.target.value })}
          />
          <Button type="button" variant="outline" className="bg-transparent" onClick={() => onRemove(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="bg-transparent" onClick={onAdd}>
        Add row
      </Button>
    </div>
  );
}
