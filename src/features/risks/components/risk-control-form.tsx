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

const controlTypeOptions: Array<{ value: RiskControlType; label: string }> = [
  { value: "PREVENTIVE", label: "Forebyggende" },
  { value: "DETECTIVE", label: "Detekterende" },
  { value: "CORRECTIVE", label: "Korrigerende" },
  { value: "DIRECTIONAL", label: "Styrende" },
  { value: "COMPENSATING", label: "Kompenserende" },
];

const frequencyOptions: Array<{ value: ControlFrequency; label: string }> = [
  { value: "WEEKLY", label: "Ukentlig" },
  { value: "MONTHLY", label: "Månedlig" },
  { value: "QUARTERLY", label: "Kvartalsvis" },
  { value: "ANNUAL", label: "Årlig" },
  { value: "BIENNIAL", label: "Annet hvert år" },
];

const statusOptions: Array<{ value: RiskControlStatus; label: string }> = [
  { value: "ACTIVE", label: "Aktiv" },
  { value: "NEEDS_IMPROVEMENT", label: "Trenger forbedring" },
  { value: "RETIRED", label: "Avviklet" },
];

const effectivenessOptions: Array<{ value: RiskControlEffectiveness; label: string }> = [
  { value: "EFFECTIVE", label: "Effektiv" },
  { value: "PARTIAL", label: "Delvis effektiv" },
  { value: "INEFFECTIVE", label: "Ikke effektiv" },
  { value: "NOT_TESTED", label: "Ikke testet" },
];

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
          title: "✅ Kontroll opprettet",
          description: "Kontrollen er lagt til i risikoregisteret",
          className: "bg-green-50 border-green-200",
        });
        setOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result.error || "Kunne ikke opprette kontroll",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Ny kontroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Legg til kontroll</DialogTitle>
          <DialogDescription>
            ISO 31000: dokumenter eier, type, frekvens og effekt for viktige kontroller
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Navn på kontroll *</Label>
            <Input id="title" name="title" placeholder="F.eks. Daglig stillaskontroll" required disabled={isPending} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="controlType">Kontrolltype *</Label>
              <Select name="controlType" defaultValue="PREVENTIVE" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg type" />
                </SelectTrigger>
                <SelectContent>
                  {controlTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerId">Eier</Label>
              <Select name="ownerId" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansvarlig (valgfritt)" />
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frequency">Revisjonsfrekvens</Label>
              <Select name="frequency" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg frekvens (valgfritt)" />
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
            <div className="space-y-2">
              <Label htmlFor="monitoringMethod">Test-/overvåkingsmetode</Label>
              <Input
                id="monitoringMethod"
                name="monitoringMethod"
                placeholder="F.eks. Visuell inspeksjon, loggkontroll"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="ACTIVE" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg status" />
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
              <Label htmlFor="effectiveness">Effekt</Label>
              <Select name="effectiveness" defaultValue="NOT_TESTED" disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg vurdering" />
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
              <Label htmlFor="nextTestDate">Neste testdato</Label>
              <Input id="nextTestDate" name="nextTestDate" type="date" disabled={isPending} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastTestedAt">Sist testet</Label>
              <Input id="lastTestedAt" name="lastTestedAt" type="date" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidenceDocumentId">Evidens (dokument)</Label>
              {documents.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  Ingen dokumenter tilgjengelig. Opprett dokumenter først.
                </div>
              ) : (
                <Select name="evidenceDocumentId" disabled={isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg dokument (valgfritt)" />
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
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Hva gjør kontrollen, og hvordan utføres den?"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Lagrer..." : "Lagre kontroll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

