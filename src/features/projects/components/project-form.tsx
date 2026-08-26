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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CdmDutyHolderFields } from "@/features/projects/components/cdm-duty-holder-fields";
import {
  emptyAppointmentHolders,
  mergeDutyHoldersForForm,
  type CdmDutyHolderInput,
} from "@/features/projects/lib/cdm-duty-holders";

interface ProjectFormProps {
  users: Array<{ id: string; name: string | null; email: string }>;
  defaultValues?: {
    id?: string;
    name?: string;
    code?: string;
    orderNumber?: string;
    clientName?: string;
    location?: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    projectManagerId?: string;
    dutyHolders?: CdmDutyHolderInput[];
  };
  mode: "create" | "edit";
}

const statusOptions = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const NO_MANAGER = "__none__";

export function ProjectForm({ users, defaultValues, mode }: ProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projectManagerId, setProjectManagerId] = useState(
    defaultValues?.projectManagerId ?? NO_MANAGER
  );
  const [dutyHolders, setDutyHolders] = useState<CdmDutyHolderInput[]>(
    defaultValues?.dutyHolders?.length
      ? mergeDutyHoldersForForm(defaultValues.dutyHolders, defaultValues.clientName)
      : emptyAppointmentHolders(defaultValues?.clientName)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name") as string,
      code: (form.get("code") as string) || undefined,
      orderNumber: (form.get("orderNumber") as string) || undefined,
      location: (form.get("location") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      status: (form.get("status") as string) || "PLANNING",
      startDate: (form.get("startDate") as string) || undefined,
      endDate: (form.get("endDate") as string) || undefined,
      projectManagerId:
        projectManagerId !== NO_MANAGER ? projectManagerId : undefined,
      dutyHolders,
    };

    try {
      const url =
        mode === "edit" && defaultValues?.id
          ? `/api/projects/${defaultValues.id}`
          : "/api/projects";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Could not save the project");
      }

      const data = await res.json();
      toast({
        title: mode === "create" ? "Project created" : "Project updated",
        className: "bg-green-50 border-green-200",
      });
      router.push(`/dashboard/projects/${data.project.id}`);
      router.refresh();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project / site details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project name *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Block C, Manchester"
                defaultValue={defaultValues?.name}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Project code</Label>
              <Input
                id="code"
                name="code"
                placeholder="e.g. PRJ-001"
                defaultValue={defaultValues?.code}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order / contract number</Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                placeholder="e.g. 2026-0142"
                defaultValue={defaultValues?.orderNumber}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Site address</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g. Block C, Spinningfields, Manchester"
                defaultValue={defaultValues?.location}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={defaultValues?.status ?? "PLANNING"} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={defaultValues?.startDate}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={defaultValues?.endDate}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Site / project manager</Label>
              <Select
                value={projectManagerId}
                onValueChange={setProjectManagerId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_MANAGER}>— None —</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Short description of the site, scope and programme"
              rows={3}
              defaultValue={defaultValues?.description ?? ""}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <CdmDutyHolderFields holders={dutyHolders} disabled={loading} onChange={setDutyHolders} />

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create project"
            : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
