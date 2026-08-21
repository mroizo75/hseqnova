"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject, updateProject } from "@/server/actions/time-registration.actions";
import { useToast } from "@/hooks/use-toast";

interface ProjectFormProps {
  tenantId: string;
  project?: {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProjectForm({
  tenantId,
  project,
  open,
  onOpenChange,
  onSuccess,
}: ProjectFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [code, setCode] = useState(project?.code ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED">(
    (project?.status as "ACTIVE" | "COMPLETED") ?? "ACTIVE"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Prosjektnavn er påkrevd" });
      return;
    }
    setLoading(true);
    try {
      if (project) {
        const res = await updateProject(project.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          status,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createProject({
          tenantId,
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        });
        if (!res.success) throw new Error(res.error);
      }
      toast({ title: project ? "Prosjekt oppdatert" : "Prosjekt opprettet" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Rediger prosjekt" : "Nytt prosjekt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Prosjektnavn *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="F.eks. Kunde X - Implementering"
              required
            />
          </div>
          <div>
            <Label htmlFor="code">Prosjektkode</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="F.eks. PRJ-001"
            />
          </div>
          {project && (
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "ACTIVE" | "COMPLETED")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="COMPLETED">Avsluttet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Valgfri beskrivelse"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Lagrer..." : project ? "Lagre" : "Opprett"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
