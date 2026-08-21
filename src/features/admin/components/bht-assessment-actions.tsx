"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  updateBhtAssessmentStatus,
  sendAssessmentToCustomer,
  completeBhtAssessment,
} from "@/server/actions/bht.actions";
import { Loader2, Send, CheckCircle2, FileText } from "lucide-react";

interface BhtAssessmentActionsProps {
  assessmentId: string;
  bhtClientId: string;
  currentStatus: string;
}

export function BhtAssessmentActions({
  assessmentId,
  bhtClientId,
  currentStatus,
}: BhtAssessmentActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [bhtComments, setBhtComments] = useState("");

  async function handleSendToCustomer() {
    setLoading("send");
    try {
      const result = await sendAssessmentToCustomer({ assessmentId });
      if (result.success) {
        toast({ title: "✅ Sendt til kunde" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleBhtReview() {
    if (!bhtComments.trim()) {
      toast({
        variant: "destructive",
        title: "Mangler kommentar",
        description: "Legg til en BHT-vurdering",
      });
      return;
    }

    setLoading("review");
    try {
      const result = await updateBhtAssessmentStatus({
        assessmentId,
        status: "BHT_REVIEWED",
        bhtComments,
      });
      if (result.success) {
        toast({ title: "✅ BHT-vurdering lagret" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleComplete() {
    setLoading("complete");
    try {
      const result = await completeBhtAssessment({ assessmentId });
      if (result.success) {
        toast({ title: "✅ Kartlegging fullført" });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Feil", description: result.error });
      }
    } finally {
      setLoading(null);
    }
  }

  if (currentStatus === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span>Kartleggingen er fullført og arkivert</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Send til kunde */}
      {(currentStatus === "DRAFT" || currentStatus === "AI_ANALYZED") && (
        <div className="flex items-center gap-4">
          <Button onClick={handleSendToCustomer} disabled={loading !== null}>
            {loading === "send" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send til kunde for bekreftelse
          </Button>
          <span className="text-sm text-muted-foreground">
            Kunden mottar kartleggingen og kan gi tilbakemelding
          </span>
        </div>
      )}

      {/* BHT-vurdering */}
      {(currentStatus === "SENT_TO_CUSTOMER" || currentStatus === "CUSTOMER_RESPONDED") && (
        <div className="space-y-3">
          <Label htmlFor="bhtComments">BHT-vurdering og kommentarer</Label>
          <Textarea
            id="bhtComments"
            value={bhtComments}
            onChange={(e) => setBhtComments(e.target.value)}
            placeholder="Legg til din faglige vurdering av kartleggingen..."
            rows={4}
          />
          <Button onClick={handleBhtReview} disabled={loading !== null}>
            {loading === "review" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Lagre BHT-vurdering
          </Button>
        </div>
      )}

      {/* Fullfør */}
      {currentStatus === "BHT_REVIEWED" && (
        <div className="flex items-center gap-4">
          <Button onClick={handleComplete} disabled={loading !== null} className="bg-green-600 hover:bg-green-700">
            {loading === "complete" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Marker som fullført
          </Button>
          <span className="text-sm text-muted-foreground">
            Merker kartleggingen som "Faglig vurdert av BHT"
          </span>
        </div>
      )}
    </div>
  );
}

