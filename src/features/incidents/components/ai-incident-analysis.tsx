"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Lightbulb,
  Scale,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { IncidentAnalysis } from "@/lib/ai-hseq";

interface AiIncidentAnalysisProps {
  incidentId: string;
  title: string;
  description: string;
  type: string;
  injuryDetails?: string;
  location?: string;
  aiEnabled: boolean;
}

const priorityStyles: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 border-red-300",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
  LOW: "bg-green-100 text-green-800 border-green-300",
};

export function AiIncidentAnalysis({
  title,
  description,
  type,
  injuryDetails,
  location,
  aiEnabled,
}: AiIncidentAnalysisProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(null);

  const handleAnalyse = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/incident-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          injuryDetails: injuryDetails || undefined,
          location: location || undefined,
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
        throw new Error("Failed to analyse incident");
      }

      const json = await response.json();
      setAnalysis(json.data);
      setExpanded(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "Could not analyse the incident. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!aiEnabled) {
    return (
      <Card className="border-dashed border-purple-300 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            AI Incident Analysis
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">AI Pro</Badge>
          </CardTitle>
          <CardDescription>
            Upgrade to AI Pro to get AI-powered root cause analysis, RIDDOR assessment and
            recommended corrective actions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Incident Analysis
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">AI Pro</Badge>
            </CardTitle>
            <CardDescription>
              AI-powered root cause analysis, RIDDOR assessment and recommended actions.
            </CardDescription>
          </div>
          {!analysis && (
            <Button onClick={handleAnalyse} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyse with AI
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {analysis && (
        <CardContent>
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between mb-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {analysis.riddorReportable ? (
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-green-600" />
                  )}
                  {analysis.rootCauses.length} root cause(s) identified
                  {analysis.riddorReportable && (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      RIDDOR Reportable
                    </Badge>
                  )}
                  {!analysis.riddorReportable && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      Not RIDDOR Reportable
                    </Badge>
                  )}
                </span>
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-5">
              <div>
                <h4 className="font-semibold text-sm mb-2">Root causes</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {analysis.rootCauses.map((cause, i) => (
                    <li key={i}>{cause}</li>
                  ))}
                </ul>
              </div>

              {analysis.contributingFactors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Contributing factors</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {analysis.contributingFactors.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-md border p-3">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  RIDDOR Assessment
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    {analysis.riddorReportable ? (
                      <Badge className="bg-red-100 text-red-800 border-red-300">Reportable</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Not reportable
                      </Badge>
                    )}
                  </div>
                  {analysis.riddorCategory && (
                    <p>
                      <span className="text-muted-foreground">Category: </span>
                      {analysis.riddorCategory}
                    </p>
                  )}
                  <p className="text-muted-foreground">{analysis.riddorReason}</p>
                </div>
              </div>

              {analysis.recommendedActions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recommended actions</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead className="w-24">Priority</TableHead>
                        <TableHead className="w-28">Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.recommendedActions.map((action, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{action.action}</TableCell>
                          <TableCell>
                            <Badge className={priorityStyles[action.priority] ?? ""}>
                              {action.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {action.deadline}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {analysis.lessonsLearned.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                    Lessons learned
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {analysis.lessonsLearned.map((lesson, i) => (
                      <li key={i}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.legalReferences.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Legal references</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.legalReferences.map((ref, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyse}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Re-analyse
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}
