"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateBhtInspection } from "@/server/actions/bht.actions";
import { Loader2, CheckCircle2, Calendar, AlertTriangle, Lightbulb } from "lucide-react";

interface BhtInspectionActionsProps {
  inspectionId: string;
  bhtClientId: string;
  currentStatus: string;
}

export function BhtInspectionActions({
  inspectionId,
  bhtClientId,
  currentStatus,
}: BhtInspectionActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inspectionDate, setInspectionDate] = useState("");
  const [findings, setFindings] = useState("");
  const [improvements, setImprovements] = useState("");

  async function handleSchedule() {
    if (!inspectionDate) {
      toast({ variant: "destructive", title: "Velg dato" });
      return;
    }

    setLoading(true);
    try {
      const result = await updateBhtInspection({
        inspectionId,
        inspectionDate: new Date(inspectionDate),
        status: "PREPARED",
      });

      if (result.success) {
        toast({ title: "✅ Vernerunde planlagt" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFindings() {
    setLoading(true);
    try {
      // Parse funn som JSON-array
      const findingsArray = findings
        .split("\n")
        .filter((f) => f.trim())
        .map((f) => ({ description: f.trim() }));

      const improvementsArray = improvements
        .split("\n")
        .filter((i) => i.trim())
        .map((i) => ({ suggestion: i.trim() }));

      const result = await updateBhtInspection({
        inspectionId,
        findings: JSON.stringify(findingsArray),
        improvements: JSON.stringify(improvementsArray),
        status: "REPORT_DONE",
      });

      if (result.success) {
        toast({ title: "✅ Funn lagret" });
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
      const result = await updateBhtInspection({
        inspectionId,
        status: "COMPLETED",
      });

      if (result.success) {
        toast({ title: "✅ Vernerunde fullført" });
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
        <span>Vernerunden er fullført og dokumentert</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Planlegg vernerunde */}
      {currentStatus === "PLANNED" && (
        <div className="space-y-3">
          <Label htmlFor="inspectionDate">Planlegg dato for vernerunde</Label>
          <div className="flex gap-4">
            <Input
              id="inspectionDate"
              type="datetime-local"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={handleSchedule} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Sett dato
            </Button>
          </div>
        </div>
      )}

      {/* Registrer funn */}
      {(currentStatus === "PREPARED" || currentStatus === "CONDUCTED") && (
        <>
          <div className="space-y-3">
            <Label htmlFor="findings" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Registrer funn og avvik (ett per linje)
            </Label>
            <Textarea
              id="findings"
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Skriv inn funn, ett per linje..."
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="improvements" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-500" />
              Forbedringsforslag (ett per linje)
            </Label>
            <Textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Skriv inn forbedringsforslag, ett per linje..."
              rows={5}
            />
          </div>

          <Button onClick={handleSaveFindings} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Lagre funn og forbedringsforslag
          </Button>
        </>
      )}

      {/* Fullfør */}
      {currentStatus === "REPORT_DONE" && (
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Marker som fullført
        </Button>
      )}
    </div>
  );
}

