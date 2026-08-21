"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addBhtConsultation } from "@/server/actions/bht.actions";
import { Loader2, Plus } from "lucide-react";

interface BhtConsultationFormProps {
  bhtClientId: string;
}

export function BhtConsultationForm({ bhtClientId }: BhtConsultationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [consultationType, setConsultationType] = useState<
    "ON_REQUEST" | "ASSESSMENT_RELATED" | "OPERATIONAL_CHANGE" | "FOLLOW_UP"
  >("ON_REQUEST");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [method, setMethod] = useState<
    "DIGITAL_MEETING" | "PHONE" | "WRITTEN" | "IN_PERSON"
  >("DIGITAL_MEETING");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isWithinScope, setIsWithinScope] = useState(true);
  const [outOfScopeNotes, setOutOfScopeNotes] = useState("");

  function resetForm() {
    setTopic("");
    setDescription("");
    setRecommendation("");
    setMethod("DIGITAL_MEETING");
    setDurationMinutes("");
    setIsWithinScope(true);
    setOutOfScopeNotes("");
    setExpanded(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!topic || !description || !recommendation) {
      toast({
        variant: "destructive",
        title: "Mangler informasjon",
        description: "Fyll ut alle påkrevde felt",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await addBhtConsultation({
        bhtClientId,
        consultationType,
        topic,
        description,
        recommendation,
        method,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        isWithinScope,
        outOfScopeNotes: !isWithinScope ? outOfScopeNotes : undefined,
      });

      if (result.success) {
        toast({
          title: "✅ Rådgivning registrert",
          description: "Rådgivningen er lagret i BHT-loggen",
        });
        resetForm();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result.error,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Systemfeil",
        description: "Kunne ikke registrere rådgivning",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <Button onClick={() => setExpanded(true)} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Registrer ny rådgivning
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type rådgivning *</Label>
          <Select
            value={consultationType}
            onValueChange={(v) =>
              setConsultationType(v as typeof consultationType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ON_REQUEST">På forespørsel</SelectItem>
              <SelectItem value="ASSESSMENT_RELATED">I forbindelse med kartlegging</SelectItem>
              <SelectItem value="OPERATIONAL_CHANGE">Ved endringer i drift</SelectItem>
              <SelectItem value="FOLLOW_UP">Oppfølging</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Metode *</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DIGITAL_MEETING">Digitalt møte</SelectItem>
              <SelectItem value="PHONE">Telefon</SelectItem>
              <SelectItem value="WRITTEN">Skriftlig i HMS Nova</SelectItem>
              <SelectItem value="IN_PERSON">Fysisk møte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="topic">Tema/emne *</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Hva ble spurt om?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Varighet (minutter)</Label>
          <Input
            id="duration"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="f.eks. 30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse av henvendelsen *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv hva kunden spurte om..."
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendation">Anbefaling/råd gitt *</Label>
        <Textarea
          id="recommendation"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Hva ble anbefalt?"
          rows={3}
          required
        />
      </div>

      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isWithinScope"
            checked={isWithinScope}
            onCheckedChange={(c) => setIsWithinScope(c as boolean)}
          />
          <Label htmlFor="isWithinScope" className="font-normal">
            Innenfor grunnpakke-scope
          </Label>
        </div>

        {!isWithinScope && (
          <>
            <p className="text-sm text-muted-foreground">
              <strong>Avgrensning (viktig):</strong> ❌ Ingen individoppfølging, ❌ Ingen behandling, ❌ Ingen NAV-saker
            </p>
            <div className="space-y-2">
              <Label htmlFor="outOfScope">Hva ble henvist til?</Label>
              <Textarea
                id="outOfScope"
                value={outOfScopeNotes}
                onChange={(e) => setOutOfScopeNotes(e.target.value)}
                placeholder="Beskriv hva kunden ble henvist til (f.eks. utvidet BHT-pakke, ekstern spesialist)"
                rows={2}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpanded(false)}
          disabled={loading}
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Registrer rådgivning
        </Button>
      </div>
    </form>
  );
}

