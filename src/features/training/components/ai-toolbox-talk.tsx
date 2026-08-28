"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Printer,
  X,
  Plus,
  Clock,
  Target,
  MessageSquare,
  Scale,
  PenLine,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ToolboxTalk } from "@/lib/ai-hseq";

interface AiToolboxTalkProps {
  aiEnabled: boolean;
}

export function AiToolboxTalk({ aiEnabled }: AiToolboxTalkProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [industry, setIndustry] = useState("");
  const [hazardInput, setHazardInput] = useState("");
  const [hazards, setHazards] = useState<string[]>([]);
  const [result, setResult] = useState<ToolboxTalk | null>(null);

  const addHazard = () => {
    const trimmed = hazardInput.trim();
    if (trimmed && !hazards.includes(trimmed)) {
      setHazards([...hazards, trimmed]);
      setHazardInput("");
    }
  };

  const removeHazard = (index: number) => {
    setHazards(hazards.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/toolbox-talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          industry: industry.trim() || undefined,
          specificHazards: hazards.length > 0 ? hazards : undefined,
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
        throw new Error("Failed to generate toolbox talk");
      }

      const json = await response.json();
      setResult(json.data);
    } catch {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Could not generate the toolbox talk. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!aiEnabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Toolbox Talk Generator
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">AI Pro</Badge>
          </CardTitle>
          <CardDescription>
            Generate a structured toolbox talk briefing for your team. Covers key safety points,
            discussion questions, and relevant UK legislation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tbt-topic">Topic *</Label>
              <Input
                id="tbt-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Working at height, Manual handling, Fire safety"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tbt-industry">Industry (optional)</Label>
              <Input
                id="tbt-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Construction, Manufacturing, Office"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specific hazards (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={hazardInput}
                onChange={(e) => setHazardInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHazard();
                  }
                }}
                placeholder="Type a hazard and press Enter"
                disabled={loading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addHazard}
                disabled={loading || !hazardInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {hazards.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hazards.map((hazard, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {hazard}
                    <button
                      type="button"
                      onClick={() => removeHazard(i)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate toolbox talk
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div ref={printRef} className="print:p-6">
          <Card className="border-purple-200">
            <CardHeader>
              <div className="flex items-center justify-between print:hidden">
                <div />
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
              <CardTitle className="text-xl">{result.title}</CardTitle>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {result.duration}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Target className="h-4 w-4 text-blue-600" />
                  Objectives
                </h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Key points</h3>
                <ol className="space-y-3">
                  {result.keyPoints.map((kp, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium">{kp.point}</p>
                          <p className="text-muted-foreground mt-0.5">{kp.detail}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  Discussion questions
                </h3>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  {result.discussionQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                  <Scale className="h-4 w-4" />
                  Legal basis
                </h3>
                <p className="text-sm text-muted-foreground">{result.legalBasis}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-1">
                  <PenLine className="h-4 w-4" />
                  Attendee sign-off
                </h3>
                <p className="text-sm text-muted-foreground mb-4 italic">
                  {result.signOffStatement}
                </p>
                <div className="grid grid-cols-2 gap-4 print:grid-cols-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-end gap-3 pb-1">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <div className="flex-1 border-b border-dashed" />
                      <span className="text-xs text-muted-foreground">Date: ___/___/______</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
