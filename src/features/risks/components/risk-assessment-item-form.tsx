"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addRiskAssessmentItem } from "@/server/actions/risk.actions";
import { useToast } from "@/hooks/use-toast";
import type { RiskCategory } from "@prisma/client";
import { GroupsAtRiskFields } from "@/features/risks/components/groups-at-risk-fields";
import { serializeGroupsAtRisk } from "@/lib/risk-mhswr";

const LEVEL_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
] as const;

const WORKPLACE_CATEGORY_OPTIONS: Array<{ value: RiskCategory; label: string }> = [
  { value: "SAFETY", label: "Safety" },
  { value: "HEALTH", label: "Health" },
  { value: "ERGONOMIC", label: "Ergonomic" },
  { value: "PSYCHOSOCIAL", label: "Psychosocial" },
  { value: "ENVIRONMENTAL", label: "Environmental" },
];

interface RiskAssessmentItemFormProps {
  riskAssessmentId: string;
  tenantId: string;
  ownerId: string;
  onAdded?: () => void;
}

export function RiskAssessmentItemForm({
  riskAssessmentId,
  tenantId,
  ownerId,
  onAdded,
}: RiskAssessmentItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("LOW");
  const [category, setCategory] = useState<RiskCategory>("SAFETY");
  const [assessmentDate, setAssessmentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [nextReviewDate, setNextReviewDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [whoMightBeHarmed, setWhoMightBeHarmed] = useState("");
  const [existingControls, setExistingControls] = useState("");
  const [groupsAtRisk, setGroupsAtRisk] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      toast({ variant: "destructive", title: "Title must be at least 3 characters" });
      return;
    }
    if (whoMightBeHarmed.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Who might be harmed is required",
        description: "Say who could be harmed and how (MHSWR 1999 reg.3(6); HSE).",
      });
      return;
    }
    if (existingControls.trim().length < 8) {
      toast({
        variant: "destructive",
        title: "Existing controls are required",
        description: "Record what you are already doing to control the risk (HSE).",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await addRiskAssessmentItem({
        riskAssessmentId,
        tenantId,
        ownerId,
        title: trimmed,
        level,
        category,
        assessmentDate: assessmentDate || null,
        nextReviewDate: nextReviewDate || null,
        whoMightBeHarmed: whoMightBeHarmed.trim(),
        existingControls: existingControls.trim(),
        groupsAtRisk: groupsAtRisk.length ? serializeGroupsAtRisk(groupsAtRisk) : null,
      });
      if (result.success) {
        toast({ title: "Risk item added", className: "bg-green-50 border-green-200" });
        setTitle("");
        setWhoMightBeHarmed("");
        setExistingControls("");
        setGroupsAtRisk([]);
        onAdded?.();
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Could not add", description: result.error });
      }
    } catch {
      toast({ variant: "destructive", title: "Could not add", description: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a risk item</CardTitle>
        <CardDescription>
          Hazard, who might be harmed, existing controls and a rating. Suitable and sufficient
          under MHSWR 1999 (HSE INDG163).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="item-title">Hazard *</Label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Working at height on the warehouse mezzanine"
                minLength={3}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-date">Assessment date</Label>
              <Input
                id="item-date"
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-next-review">Next review</Label>
              <Input
                id="item-next-review"
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-who">Who might be harmed and how *</Label>
            <Textarea
              id="item-who"
              value={whoMightBeHarmed}
              onChange={(e) => setWhoMightBeHarmed(e.target.value)}
              placeholder="Employees, contractors or others who could be harmed, and how."
              disabled={loading}
              rows={3}
              required
            />
          </div>
          <GroupsAtRiskFields
            idPrefix="item-who-groups"
            value={groupsAtRisk}
            onChange={setGroupsAtRisk}
            disabled={loading}
          />
          <div className="space-y-2">
            <Label htmlFor="item-controls">Existing controls *</Label>
            <Textarea
              id="item-controls"
              value={existingControls}
              onChange={(e) => setExistingControls(e.target.value)}
              placeholder="What is already in place: training, PPE, guarding, permits, supervision."
              disabled={loading}
              rows={3}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v: RiskCategory) => setCategory(v)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKPLACE_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add risk item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
