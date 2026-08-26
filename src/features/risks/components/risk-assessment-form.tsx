"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRiskAssessment } from "@/server/actions/risk.actions";
import { useToast } from "@/hooks/use-toast";

interface RiskAssessmentFormProps {
  tenantId: string;
  defaultYear: number;
  projects: Array<{ id: string; name: string }>;
}

const NO_PROJECT_VALUE = "__none_project__";

export function RiskAssessmentForm({ tenantId, defaultYear, projects }: RiskAssessmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(`Risk assessment ${defaultYear}`);
  const [year, setYear] = useState(defaultYear);
  const [participants, setParticipants] = useState("");
  const [projectId, setProjectId] = useState<string>(NO_PROJECT_VALUE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createRiskAssessment({
        tenantId,
        projectId: projectId === NO_PROJECT_VALUE ? null : projectId,
        title: title.trim(),
        assessmentYear: year,
        participants: participants.trim() || undefined,
      });
      if (result.success && result.data) {
        toast({
          title: "Risk assessment created",
          description: `You can now add risk items for ${year}.`,
          className: "bg-green-50 border-green-200",
        });
        router.push(`/dashboard/risks/assessment/${result.data.id}`);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not create",
          description: result.error ?? "Could not create the risk assessment.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Could not create",
        description: "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Risk assessment</CardTitle>
          <CardDescription>
            Title and year for a suitable and sufficient assessment (MHSWR 1999). After you create it,
            add the individual risk items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. Risk assessment ${defaultYear}`}
                required
                minLength={3}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || defaultYear)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT_VALUE}>Not linked to a project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Use this when the assessment covers a CDM 2015 project or site.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">
              People involved
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (SRSCWR 1977 / HSCER 1996)
              </span>
            </Label>
            <Textarea
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="e.g. Jane Smith (competent person), Tom Hughes (safety representative), Priya Patel (site supervisor)"
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Consult employees and safety representatives when assessing risks. Record who took part
              so you can show consultation at audit.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create risk assessment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
