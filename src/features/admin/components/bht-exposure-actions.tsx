"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  updateBhtExposureAssessment,
  completeBhtExposure,
} from "@/server/actions/bht.actions";
import { Loader2, CheckCircle2 } from "lucide-react";

interface BhtExposureActionsProps {
  exposureId: string;
  bhtClientId: string;
  currentStatus: string;
  currentConclusion: string | null;
}

export function BhtExposureActions({
  exposureId,
  bhtClientId,
  currentStatus,
  currentConclusion,
}: BhtExposureActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [conclusion, setConclusion] = useState<"SUFFICIENT" | "NEEDS_FOLLOWUP">(
    (currentConclusion as any) || "SUFFICIENT"
  );
  const [notes, setNotes] = useState("");
  const [furtherNotes, setFurtherNotes] = useState("");

  async function handleSave() {
    setLoading(true);
    try {
      const result = await updateBhtExposureAssessment({
        exposureId,
        conclusion,
        assessmentNotes: notes || undefined,
        furtherActionNotes: conclusion === "NEEDS_FOLLOWUP" ? furtherNotes : undefined,
      });

      if (result.success) {
        toast({ title: "✅ Vurdering lagret" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const result = await completeBhtExposure({ exposureId });
      if (result.success) {
        toast({ title: "✅ Eksponeringsvurdering fullført" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span>Eksponeringsvurderingen er fullført</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>BHT-konklusjon</Label>
        <RadioGroup
          value={conclusion}
          onValueChange={(v) => setConclusion(v as typeof conclusion)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SUFFICIENT" id="sufficient" />
            <Label htmlFor="sufficient" className="font-normal">
              ✔ Tilstrekkelig vurdert - ingen videre tiltak nødvendig
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="NEEDS_FOLLOWUP" id="followup" />
            <Label htmlFor="followup" className="font-normal">
              ⚠ Anbefaler videre kartlegging (tilleggstjeneste)
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Vurderingsnotat</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Kort vurderingsnotat fra BHT..."
          rows={3}
        />
      </div>

      {conclusion === "NEEDS_FOLLOWUP" && (
        <div className="space-y-2">
          <Label htmlFor="furtherNotes">Hva anbefales?</Label>
          <Textarea
            id="furtherNotes"
            value={furtherNotes}
            onChange={(e) => setFurtherNotes(e.target.value)}
            placeholder="Beskriv anbefalt videre kartlegging..."
            rows={3}
          />
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Lagre vurdering
        </Button>

        {currentStatus === "BHT_REVIEWED" && (
          <Button
            onClick={handleComplete}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marker som fullført
          </Button>
        )}
      </div>
    </div>
  );
}

