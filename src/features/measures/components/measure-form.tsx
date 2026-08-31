"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMeasure } from "@/server/actions/measure.actions";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { ControlFrequency, MeasureCategory } from "@prisma/client";

const categoryOptions: Array<{ value: MeasureCategory; label: string }> = [
  { value: "CORRECTIVE", label: "Corrective" },
  { value: "PREVENTIVE", label: "Preventive" },
  { value: "IMPROVEMENT", label: "Improvement" },
  { value: "MITIGATION", label: "Risk reduction" },
];

const frequencyOptions: Array<{ value: ControlFrequency; label: string }> = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "BIENNIAL", label: "Every two years" },
];

interface MeasureFormProps {
  tenantId: string;
  projectId?: string;
  riskId?: string;
  incidentId?: string;
  auditId?: string;
  goalId?: string;
  fireDrillId?: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  trigger?: React.ReactNode;
}

export function MeasureForm({
  tenantId,
  projectId,
  riskId,
  incidentId,
  auditId,
  goalId,
  fireDrillId,
  users,
  trigger,
}: MeasureFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId,
      projectId,
      riskId,
      incidentId,
      auditId,
      goalId,
      fireDrillId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      dueAt: formData.get("dueAt") as string,
      responsibleId: formData.get("responsibleId") as string,
      status: "PENDING",
      category: formData.get("category") as string,
      followUpFrequency: formData.get("followUpFrequency") as string,
      costEstimate: formData.get("costEstimate") as string,
      benefitEstimate: formData.get("benefitEstimate") as string,
    };

    try {
      const result = await createMeasure(data);

      if (result.success) {
        toast({
          title: "Action created",
          description: "The owner will be notified",
          className: "bg-green-50 border-green-200",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Could not create the action",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add further action
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Add further action</DialogTitle>
          <DialogDescription>
            Extra control — what will be done, who is responsible, and when (MHSWR 1999
            reg.5; HSG245).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {projectId ? (
            <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
              This action will be linked to the selected project.
            </div>
          ) : null}
          {fireDrillId ? (
            <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
              This action will be linked to the selected fire drill.
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Fit a guardrail on the roof"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What will be done, how, and any resources needed"
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Action type *</Label>
              <Select name="category" defaultValue="MITIGATION" disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpFrequency">Follow-up *</Label>
              <Select name="followUpFrequency" defaultValue="ANNUAL" disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costEstimate">Cost estimate (GBP)</Label>
              <Input
                id="costEstimate"
                name="costEstimate"
                placeholder="e.g. 1500"
                type="number"
                min={0}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefitEstimate">Expected benefit (points)</Label>
              <Input
                id="benefitEstimate"
                name="benefitEstimate"
                placeholder="e.g. 30"
                type="number"
                min={0}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsibleId">Owner *</Label>
              <Select name="responsibleId" required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueAt">Due date *</Label>
              <Input
                id="dueAt"
                name="dueAt"
                type="date"
                required
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 border p-4">
            <p className="text-sm font-medium mb-2">HSG245 — what, who, when</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Say <strong>what</strong> will be done</li>
              <li>Name the <strong>person responsible</strong></li>
              <li>Set a realistic <strong>due date</strong></li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create action"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

