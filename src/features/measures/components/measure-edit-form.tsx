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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateMeasure } from "@/server/actions/measure.actions";
import { useToast } from "@/hooks/use-toast";
import type { ActionEffectiveness, ActionStatus, ControlFrequency, MeasureCategory } from "@prisma/client";
import type { Measure } from "@prisma/client";

const categoryOptions: Array<{ value: MeasureCategory; label: string }> = [
  { value: "CORRECTIVE", label: "Korrigerende" },
  { value: "PREVENTIVE", label: "Forebyggende" },
  { value: "IMPROVEMENT", label: "Forbedring" },
  { value: "MITIGATION", label: "Risikoreduserende" },
];

const frequencyOptions: Array<{ value: ControlFrequency; label: string }> = [
  { value: "WEEKLY", label: "Ukentlig" },
  { value: "MONTHLY", label: "Månedlig" },
  { value: "QUARTERLY", label: "Kvartalsvis" },
  { value: "ANNUAL", label: "Årlig" },
  { value: "BIENNIAL", label: "Annet hvert år" },
];

const statusOptions: Array<{ value: ActionStatus; label: string }> = [
  { value: "PENDING", label: "Ikke startet" },
  { value: "IN_PROGRESS", label: "Pågår" },
  { value: "DONE", label: "Fullført" },
];

const effectivenessOptions: Array<{ value: ActionEffectiveness; label: string }> = [
  { value: "EFFECTIVE", label: "Effektivt" },
  { value: "PARTIALLY_EFFECTIVE", label: "Delvis effektivt" },
  { value: "INEFFECTIVE", label: "Ikke effektivt" },
  { value: "NOT_EVALUATED", label: "Ikke evaluert" },
];

interface MeasureEditFormProps {
  measure: Measure & {
    risk?: { id: string; title: string } | null;
    responsible?: { id: string; name: string | null; email: string } | null;
  };
  users: Array<{ id: string; name: string | null; email: string }>;
}

function formatDateInput(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function MeasureEditForm({ measure, users }: MeasureEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(measure.title);
  const [description, setDescription] = useState(measure.description || "");
  const [dueAt, setDueAt] = useState(formatDateInput(measure.dueAt));
  const [responsibleId, setResponsibleId] = useState(measure.responsibleId);
  const [status, setStatus] = useState<ActionStatus>(measure.status);
  const [category, setCategory] = useState<MeasureCategory>(measure.category);
  const [followUpFrequency, setFollowUpFrequency] = useState<ControlFrequency>(
    measure.followUpFrequency || "ANNUAL"
  );
  const [costEstimate, setCostEstimate] = useState(
    measure.costEstimate?.toString() ?? ""
  );
  const [benefitEstimate, setBenefitEstimate] = useState(
    measure.benefitEstimate?.toString() ?? ""
  );
  const [effectiveness, setEffectiveness] = useState<ActionEffectiveness>(
    measure.effectiveness || "NOT_EVALUATED"
  );
  const [effectivenessNote, setEffectivenessNote] = useState(
    measure.effectivenessNote || ""
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: measure.id,
      title,
      description: description || undefined,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      responsibleId,
      status,
      category,
      followUpFrequency,
      costEstimate: costEstimate ? parseInt(costEstimate, 10) : undefined,
      benefitEstimate: benefitEstimate ? parseInt(benefitEstimate, 10) : undefined,
      effectiveness: status === "DONE" ? effectiveness : undefined,
      effectivenessNote: status === "DONE" ? effectivenessNote : undefined,
      completedAt: status === "DONE" ? new Date().toISOString() : undefined,
    };

    try {
      const result = await updateMeasure(payload);

      if (result.success) {
        toast({
          title: "✅ Tiltak oppdatert",
          description: "Endringene er lagret",
          className: "bg-green-50 border-green-200",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result.error || "Kunne ikke oppdatere tiltak",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Uventet feil",
        description: "Noe gikk galt",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grunnleggende</CardTitle>
          <CardDescription>
            Tittel, beskrivelse og ansvarlig person
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={loading}
              placeholder="Beskriv tiltaket og hva som skal gjøres"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsibleId">Ansvarlig person *</Label>
              <Select
                value={responsibleId}
                onValueChange={setResponsibleId}
                required
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg ansvarlig" />
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
              <Label htmlFor="dueAt">Frist *</Label>
              <Input
                id="dueAt"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status og oppfølging</CardTitle>
          <CardDescription>
            Oppdater status og dokumenter fremgang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={status}
              onValueChange={(v: ActionStatus) => setStatus(v)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Tiltakstype</Label>
              <Select
                value={category}
                onValueChange={(v: MeasureCategory) => setCategory(v)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpFrequency">Oppfølgingsfrekvens</Label>
              <Select
                value={followUpFrequency}
                onValueChange={(v: ControlFrequency) => setFollowUpFrequency(v)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costEstimate">Kostnadsestimat (NOK)</Label>
              <Input
                id="costEstimate"
                type="number"
                min={0}
                value={costEstimate}
                onChange={(e) => setCostEstimate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefitEstimate">Forventet effekt (poeng)</Label>
              <Input
                id="benefitEstimate"
                type="number"
                min={0}
                value={benefitEstimate}
                onChange={(e) => setBenefitEstimate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {status === "DONE" && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluering</CardTitle>
            <CardDescription>
              Dokumenter effekt og resultat når tiltaket er fullført
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveness">Effekt av tiltak</Label>
              <Select
                value={effectiveness}
                onValueChange={(v: ActionEffectiveness) => setEffectiveness(v)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {effectivenessOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectivenessNote">Evaluering / notater</Label>
              <Textarea
                id="effectivenessNote"
                value={effectivenessNote}
                onChange={(e) => setEffectivenessNote(e.target.value)}
                rows={3}
                disabled={loading}
                placeholder="Beskriv resultat, læringspunkter eller behov for oppfølging"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Lagrer..." : "Lagre endringer"}
        </Button>
      </div>
    </form>
  );
}
