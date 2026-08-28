"use client";

import { useState, useTransition } from "react";
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  ControlFrequency,
  RiskControlEffectiveness,
  RiskControlStatus,
  RiskControlType,
} from "@prisma/client";
import { createRiskControl } from "@/server/actions/risk-register.actions";

// SFAIRP hierarchy — MHSWR 1999 Sch.1 general principles of prevention
const SFAIRP_HIERARCHY: Array<{
  value: RiskControlType;
  label: string;
  level: number;
  description: string;
}> = [
  { value: "ELIMINATION", level: 1, label: "Elimination", description: "Remove the hazard entirely" },
  { value: "SUBSTITUTION", level: 2, label: "Substitution", description: "Replace with less hazardous" },
  { value: "ENGINEERING", level: 3, label: "Engineering controls", description: "Isolate people from the hazard" },
  { value: "ADMINISTRATIVE", level: 4, label: "Administrative controls", description: "Change the way people work" },
  { value: "PPE", level: 5, label: "PPE", description: "Protect the worker with equipment" },
];

const LEGACY_CONTROL_TYPES: Array<{ value: RiskControlType; label: string }> = [
  { value: "PREVENTIVE", label: "Preventive (legacy)" },
  { value: "DETECTIVE", label: "Detective (legacy)" },
  { value: "CORRECTIVE", label: "Corrective (legacy)" },
  { value: "DIRECTIONAL", label: "Directional (legacy)" },
  { value: "COMPENSATING", label: "Compensating (legacy)" },
];

const frequencyOptions: Array<{ value: ControlFrequency; label: string }> = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL", label: "Annual" },
  { value: "BIENNIAL", label: "Biennial" },
];

const statusOptions: Array<{ value: RiskControlStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs improvement" },
  { value: "RETIRED", label: "Retired" },
];

const effectivenessOptions: Array<{ value: RiskControlEffectiveness; label: string }> = [
  { value: "EFFECTIVE", label: "Effective" },
  { value: "PARTIAL", label: "Partially effective" },
  { value: "INEFFECTIVE", label: "Ineffective" },
  { value: "NOT_TESTED", label: "Not tested" },
];

const LEVEL_COLOURS = [
  "",
  "bg-green-100 text-green-800 border-green-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-yellow-100 text-yellow-800 border-yellow-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-red-100 text-red-800 border-red-300",
] as const;

interface RiskControlFormProps {
  riskId: string;
  users: Array<{ id: string; name?: string | null; email?: string | null }>;
  documents: Array<{ id: string; title: string }>;
}

export function RiskControlForm({ riskId, users, documents }: RiskControlFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createRiskControl({
        riskId,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        controlType: formData.get("controlType") as RiskControlType,
        ownerId: (formData.get("ownerId") as string) || undefined,
        frequency: (formData.get("frequency") as ControlFrequency) || undefined,
        effectiveness: formData.get("effectiveness") as RiskControlEffectiveness,
        status: formData.get("status") as RiskControlStatus,
        monitoringMethod: formData.get("monitoringMethod") as string,
        evidenceDocumentId: (formData.get("evidenceDocumentId") as string) || undefined,
        nextTestDate: (formData.get("nextTestDate") as string) || undefined,
        lastTestedAt: (formData.get("lastTestedAt") as string) || undefined,
      });

      if (result.success) {
        toast({
          title: "Control created",
          description: "The control has been added to the risk register",
          className: "bg-green-50 border-green-200",
        });
        setOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Could not create control",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New control
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add control</DialogTitle>
          <DialogDescription>
            SFAIRP hierarchy of controls per MHSWR 1999 Schedule 1. Document owner, type, frequency and effectiveness.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Control name *</Label>
            <Input id="title" name="title" placeholder="e.g. Daily scaffold inspection" required disabled={isPending} />
          </div>

          {/* SFAIRP hierarchy selector — HSWA s.2, MHSWR reg.4 */}
          <div className="space-y-2">
            <Label htmlFor="controlType">
              Control type * <span className="text-xs text-muted-foreground">(SFAIRP hierarchy)</span>
            </Label>
            <Select name="controlType" defaultValue="ELIMINATION" disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select control type" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Hierarchy of controls (most → least effective)
                </div>
                {SFAIRP_HIERARCHY.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold ${LEVEL_COLOURS[h.level]}`}
                      >
                        {h.level}
                      </span>
                      <span>{h.label}</span>
                      <span className="text-xs text-muted-foreground">— {h.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="mt-1 border-t px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Legacy types
                </div>
                {LEGACY_CONTROL_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Select name="ownerId" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select responsible person (optional)" />
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
              <Label htmlFor="frequency">Review frequency</Label>
              <Select name="frequency" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency (optional)" />
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
              <Label htmlFor="monitoringMethod">Monitoring / test method</Label>
              <Input
                id="monitoringMethod"
                name="monitoringMethod"
                placeholder="e.g. Visual inspection, log review"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextTestDate">Next test date</Label>
              <Input id="nextTestDate" name="nextTestDate" type="date" disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="ACTIVE" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveness">Effectiveness</Label>
              <Select name="effectiveness" defaultValue="NOT_TESTED" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {effectivenessOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastTestedAt">Last tested</Label>
              <Input id="lastTestedAt" name="lastTestedAt" type="date" disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="evidenceDocumentId">Evidence (document)</Label>
              {documents.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  No documents available. Create documents first.
                </div>
              ) : (
                <Select name="evidenceDocumentId" disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What does this control do and how is it carried out?"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save control"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

