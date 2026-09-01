"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRiskAssessment } from "@/server/actions/risk.actions";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Pencil, Users, X } from "lucide-react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { GroupsAtRiskFields } from "@/features/risks/components/groups-at-risk-fields";
import {
  assessMhswrRecord,
  parseGroupsAtRisk,
  serializeGroupsAtRisk,
} from "@/lib/risk-mhswr";

interface RiskFinding {
  title?: string | null;
  context?: string | null;
  existingControls?: string | null;
  nextReviewDate?: Date | string | null;
}

interface ComplianceCardProps {
  assessment: {
    id: string;
    participants: string | null;
    approvedById: string | null;
    approvedAt: Date | null;
    reviewedById: string | null;
    reviewedAt: Date | null;
    groupsAtRisk: string | null;
  };
  risks: RiskFinding[];
  users: Array<{ id: string; name: string | null; email: string }>;
}

const NO_USER = "__none__";

const formatDate = (date: Date | string | null) => {
  if (!date) return null;
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(parsed, "d MMM yyyy", { locale: enGB });
};

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function RiskAssessmentComplianceCard({
  assessment,
  risks,
  users,
}: ComplianceCardProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [participants, setParticipants] = useState(assessment.participants ?? "");
  const [approvedById, setApprovedById] = useState(assessment.approvedById ?? NO_USER);
  const [approvedAt, setApprovedAt] = useState(toDateInput(assessment.approvedAt));
  const [reviewedById, setReviewedById] = useState(assessment.reviewedById ?? NO_USER);
  const [reviewedAt, setReviewedAt] = useState(toDateInput(assessment.reviewedAt));
  const [groupsAtRisk, setGroupsAtRisk] = useState<string[]>(
    parseGroupsAtRisk(assessment.groupsAtRisk),
  );

  const assessedByUser = users.find((u) => u.id === assessment.approvedById);
  const reviewedByUser = users.find((u) => u.id === assessment.reviewedById);

  const check = assessMhswrRecord({
    risks,
    groupsAtRisk: assessment.groupsAtRisk,
    participants: assessment.participants,
    reviewedAt: assessment.reviewedAt,
  });

  async function handleSave() {
    if (groupsAtRisk.length === 0) {
      toast({
        variant: "destructive",
        title: "Groups especially at risk",
        description:
          "Record any group especially at risk, or tick none identified (MHSWR 1999 reg.3(6)(b)).",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await updateRiskAssessment({
        id: assessment.id,
        participants: participants || undefined,
        approvedById: approvedById === NO_USER ? null : approvedById,
        approvedAt: approvedAt || null,
        reviewedById: reviewedById === NO_USER ? null : reviewedById,
        reviewedAt: reviewedAt || null,
        groupsAtRisk: serializeGroupsAtRisk(groupsAtRisk),
      });

      if (result.success) {
        toast({
          title: "Saved",
          description: "MHSWR record updated.",
          className: "bg-green-50 border-green-200",
        });
        setEditing(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  }

  const checklist = [
    {
      ok: check.significantFindings,
      label: "Significant findings recorded",
      hint: "Hazard, who might be harmed and how, existing controls (reg.3(6)(a); HSE).",
    },
    {
      ok: check.groupsRecorded,
      label: "Groups especially at risk recorded",
      hint: "Any group of employees especially at risk, or none identified (reg.3(6)(b)).",
    },
    {
      ok: check.reviewRecorded,
      label: "Review recorded",
      hint: "Review if no longer valid or after a significant change (reg.3(3)).",
    },
    {
      ok: check.consulted,
      label: "Employees / safety representatives consulted",
      hint: "Good practice under SRSCWR 1977 / HSCER 1996 — not a MHSWR recording duty.",
    },
  ];

  return (
    <Card className={`border-l-4 ${check.complete ? "border-l-green-500" : "border-l-amber-400"}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm sm:text-base">
              Record of the assessment (MHSWR 1999 reg.3)
            </CardTitle>
            {check.complete ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle2 className="h-3 w-3" /> Record complete
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-800">
                Record incomplete
              </span>
            )}
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <GroupsAtRiskFields
              idPrefix="assessment-especially"
              variant="especially"
              value={groupsAtRisk}
              onChange={setGroupsAtRisk}
              disabled={loading}
            />

            <div className="space-y-2">
              <Label>
                Consultation (optional)
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (SRSCWR 1977, HSCER 1996)
                </span>
              </Label>
              <Textarea
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="e.g. Jane Smith (HSE Manager), John Brown (Safety Representative), Sarah Green (Line Manager)"
                rows={2}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Consult employees and safety representatives on health and safety. This is not a
                MHSWR “approval” step.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Assessed by
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (competent person — MHSWR 1999 reg.7)
                  </span>
                </Label>
                <Select value={approvedById} onValueChange={setApprovedById} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_USER}>— Not set —</SelectItem>
                    {users.filter((u) => u.id).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assessment date</Label>
                <Input
                  type="date"
                  value={approvedAt}
                  onChange={(e) => setApprovedAt(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Last reviewed by
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (MHSWR 1999 reg.3(3))
                  </span>
                </Label>
                <Select value={reviewedById} onValueChange={setReviewedById} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_USER}>— Not set —</SelectItem>
                    {users.filter((u) => u.id).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Review date</Label>
                <Input
                  type="date"
                  value={reviewedAt}
                  onChange={(e) => setReviewedAt(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={handleSave} disabled={loading} size="sm">
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-start gap-2 text-sm">
                  {item.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  )}
                  <span>
                    <span className="font-medium">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.hint}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="grid gap-4 sm:grid-cols-3 text-sm border-t pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  <Users className="h-3.5 w-3.5" /> Consultation
                </div>
                {assessment.participants ? (
                  <p className="text-sm">{assessment.participants}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not recorded</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Assessed by
                </div>
                {assessedByUser && assessment.approvedAt ? (
                  <>
                    <p className="text-sm font-medium">{assessedByUser.name || assessedByUser.email}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(assessment.approvedAt)}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not recorded</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Last reviewed
                </div>
                {reviewedByUser && assessment.reviewedAt ? (
                  <>
                    <p className="text-sm font-medium">{reviewedByUser.name || reviewedByUser.email}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(assessment.reviewedAt)}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Not recorded</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
