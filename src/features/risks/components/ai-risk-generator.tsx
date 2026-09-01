"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedRiskAssessment } from "@/lib/ai-hseq";

interface AiRiskGeneratorProps {
  onApply: (data: GeneratedRiskAssessment) => void;
  existingRisks?: string[];
  disabled?: boolean;
}

export function AiRiskGenerator({ onApply, existingRisks, disabled }: AiRiskGeneratorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<GeneratedRiskAssessment | null>(null);

  const handleGenerate = async () => {
    if (!activity.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/risk-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: activity.trim(),
          location: location.trim() || undefined,
          existingRisks,
        }),
      });

      if (response.status === 403) {
        toast({
          variant: "destructive",
          title: "AI Pro required",
          description: "AI Pro add-on is not enabled for this organisation.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to generate risk assessment");
      }

      const json = await response.json();
      setResult(json.data);
    } catch {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Could not generate the risk assessment. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    setOpen(false);
    setResult(null);
    setActivity("");
    setLocation("");
    toast({
      title: "AI assessment applied",
      description: "The generated data has been filled in. Review and adjust before saving.",
      className: "bg-green-50 border-green-200",
    });
  };

  const riskScore = (l: number, s: number) => l * s;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          Generate with AI
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 ml-1">
            AI Pro
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Generate risk assessment with AI
          </DialogTitle>
          <DialogDescription>
            Describe the activity and AI will generate a suitable and sufficient risk assessment
            based on UK legislation (MHSWR 1999).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ai-activity">Activity description *</Label>
            <Textarea
              id="ai-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. Manual handling of heavy boxes in warehouse, working at height on scaffolding, use of angle grinder on steel beams"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-location">Location (optional)</Label>
            <Input
              id="ai-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Warehouse floor, Construction site, Office"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !activity.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating assessment...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>

          {result && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  {result.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{result.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    Hazards identified
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                  {result.hazards?.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-1">Who is at risk</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.whoAtRisk?.map((w, i) => (
                      <Badge key={i} variant="outline">{w}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Existing controls</h4>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {result.existingControls?.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Additional controls</h4>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {result.additionalControls?.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    Risk scores
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Before controls</p>
                      <p className="text-lg font-bold text-red-600">
                        {riskScore(result.likelihoodBefore, result.severityBefore)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        L{result.likelihoodBefore} × S{result.severityBefore}
                      </p>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-xs text-muted-foreground">After controls</p>
                      <p className="text-lg font-bold text-green-600">
                        {riskScore(result.likelihoodAfter, result.severityAfter)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        L{result.likelihoodAfter} × S{result.severityAfter}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-1">Legal reference</h4>
                  <p className="text-sm text-muted-foreground">{result.legalReference}</p>
                </div>

                <Button onClick={handleApply} className="w-full gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Apply to form
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
