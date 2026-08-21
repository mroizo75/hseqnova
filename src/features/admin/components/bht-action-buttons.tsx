"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  startBhtAssessment,
  startBhtAmoMeeting,
  startBhtInspection,
  startBhtExposureAssessment,
  generateBhtAnnualReport,
} from "@/server/actions/bht.actions";
import { Loader2, Play } from "lucide-react";

interface BhtActionButtonsProps {
  action: "assessment" | "amo" | "inspection" | "exposure" | "report";
  bhtClientId: string;
  year: number;
  label: string;
}

export function BhtActionButtons({
  action,
  bhtClientId,
  year,
  label,
}: BhtActionButtonsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    setLoading(true);

    try {
      let result;

      switch (action) {
        case "assessment":
          result = await startBhtAssessment({ bhtClientId, year });
          break;
        case "amo":
          result = await startBhtAmoMeeting({ bhtClientId, year });
          break;
        case "inspection":
          result = await startBhtInspection({ bhtClientId, year });
          break;
        case "exposure":
          result = await startBhtExposureAssessment({ bhtClientId, year });
          break;
        case "report":
          result = await generateBhtAnnualReport({ bhtClientId, year });
          break;
      }

      if (result?.success) {
        toast({
          title: "✅ Startet",
          description: getSuccessMessage(action),
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Feil",
          description: result?.error || "Kunne ikke starte",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Systemfeil",
        description: "En uventet feil oppstod",
      });
    } finally {
      setLoading(false);
    }
  }

  function getSuccessMessage(action: string) {
    switch (action) {
      case "assessment":
        return "Kartlegging startet med AI-analyse";
      case "amo":
        return "AMO-møte opprettet med AI-agenda";
      case "inspection":
        return "Vernerunde opprettet med AI-sjekkliste";
      case "exposure":
        return "Eksponeringsvurdering startet med AI";
      case "report":
        return "Årsrapport generert med AI";
      default:
        return "Aktivitet startet";
    }
  }

  return (
    <Button
      onClick={handleAction}
      disabled={loading}
      size="sm"
      className="w-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}

