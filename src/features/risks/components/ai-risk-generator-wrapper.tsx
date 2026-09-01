"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AiRiskGenerator } from "./ai-risk-generator";
import { Sparkles } from "lucide-react";
import type { GeneratedRiskAssessment } from "@/lib/ai-hseq";

interface AiRiskGeneratorWrapperProps {
  existingRisks?: string[];
}

export function AiRiskGeneratorWrapper({ existingRisks }: AiRiskGeneratorWrapperProps) {
  const [lastGenerated, setLastGenerated] = useState<GeneratedRiskAssessment | null>(null);

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              AI-Assisted Risk Generation
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">AI Pro</Badge>
            </CardTitle>
            <CardDescription>
              Use AI to generate risk assessments based on your activity description. Review the
              output carefully before adding.
            </CardDescription>
          </div>
          <AiRiskGenerator
            onApply={setLastGenerated}
            existingRisks={existingRisks}
          />
        </div>
      </CardHeader>
      {lastGenerated && (
        <CardContent>
          <div className="rounded-md border bg-white p-3 space-y-2 text-sm">
            <p className="font-medium">{lastGenerated.title}</p>
            <p className="text-muted-foreground">{lastGenerated.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {lastGenerated.hazards?.map((h, i) => (
                <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Use the information above to fill in the risk item form below.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
