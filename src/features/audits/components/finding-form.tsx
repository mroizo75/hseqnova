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
import { Card, CardContent } from "@/components/ui/card";
import { createFinding } from "@/server/actions/audit.actions";
import { auditClauseOptions } from "@/features/audits/schemas/audit.schema";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { IsoAuditSamplePool } from "@/server/queries/iso.queries";

interface FindingFormProps {
  auditId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  samples?: IsoAuditSamplePool;
  trigger?: React.ReactNode;
}

export function FindingForm({ auditId, users, samples, trigger }: FindingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      auditId,
      findingType: formData.get("findingType") as string,
      clause: formData.get("clause") as string,
      description: formData.get("description") as string,
      evidence: formData.get("evidence") as string,
      requirement: formData.get("requirement") as string,
      responsibleId: formData.get("responsibleId") as string,
      dueDate: formData.get("dueDate") as string || undefined,
      incidentId: (formData.get("incidentId") as string) || undefined,
      riskId: (formData.get("riskId") as string) || undefined,
      trainingId: (formData.get("trainingId") as string) || undefined,
    };

    const result = await createFinding(data);

    if (result.success) {
      toast({
        title: "Finding recorded",
        description: "The audit finding is documented against the selected clause.",
        className: "bg-green-50 border-green-200",
      });
      setOpen(false);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not record finding",
        description: result.error || "The finding could not be saved",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record finding
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record an audit finding</DialogTitle>
          <DialogDescription>
            Link the finding to an ISO 45001 or ISO 9001 clause. Evidence stays with this audit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="findingType">Finding type *</Label>
              <Select name="findingType" required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAJOR_NC">Major nonconformity</SelectItem>
                  <SelectItem value="MINOR_NC">Minor nonconformity</SelectItem>
                  <SelectItem value="OBSERVATION">Observation</SelectItem>
                  <SelectItem value="STRENGTH">Strength</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clause">ISO clause *</Label>
              <Select name="clause" required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select clause" />
                </SelectTrigger>
                <SelectContent>
                  {auditClauseOptions().map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What was observed..."
              required
              disabled={loading}
              minLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Objective evidence *</Label>
            <Textarea
              id="evidence"
              name="evidence"
              rows={3}
              placeholder="e.g. 'The competence matrix showed 3 of 8 employees with expired required training'"
              required
              disabled={loading}
              minLength={10}
            />
            <p className="text-sm text-muted-foreground">
              Record objective observations the auditor can follow.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirement">Requirement not met *</Label>
            <Textarea
              id="requirement"
              name="requirement"
              rows={2}
              placeholder="Which ISO 45001 / 9001 clause or internal procedure is not met?"
              required
              disabled={loading}
              minLength={10}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsibleId">Owner for close-out *</Label>
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
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="incidentId">Sampled incident</Label>
              <select id="incidentId" name="incidentId" className="h-9 w-full rounded-md border bg-transparent px-2 text-sm" disabled={loading}>
                <option value="">None</option>
                {(samples?.incidents ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="riskId">Sampled risk</Label>
              <select id="riskId" name="riskId" className="h-9 w-full rounded-md border bg-transparent px-2 text-sm" disabled={loading}>
                <option value="">None</option>
                {(samples?.risks ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainingId">Sampled competence record</Label>
              <select id="trainingId" name="trainingId" className="h-9 w-full rounded-md border bg-transparent px-2 text-sm" disabled={loading}>
                <option value="">None</option>
                {(samples?.trainings ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-amber-900 mb-2">
                💡 Finding types:
              </p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li><strong>Major nonconformity:</strong> a critical departure from ISO 45001 or 9001</li>
                <li><strong>Minor nonconformity:</strong> a lesser gap that still needs close-out</li>
                <li><strong>Observation:</strong> a potential issue to follow up</li>
                <li><strong>Strength:</strong> good practice worth sharing</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrerer..." : "Registrer funn"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

