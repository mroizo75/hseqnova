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
import { CheckCircle2, Users, Pencil, X } from "lucide-react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";

interface ComplianceCardProps {
  assessment: {
    id: string;
    participants: string | null;
    approvedById: string | null;
    approvedAt: Date | null;
    reviewedById: string | null;
    reviewedAt: Date | null;
  };
  users: Array<{ id: string; name: string | null; email: string }>;
}

const NO_USER = "__none__";

const formatDate = (date: Date | null) =>
  date ? format(new Date(date), "d MMM yyyy", { locale: enGB }) : null;

export function RiskAssessmentComplianceCard({ assessment, users }: ComplianceCardProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [participants, setParticipants] = useState(assessment.participants ?? "");
  const [approvedById, setApprovedById] = useState(assessment.approvedById ?? NO_USER);
  const [approvedAt, setApprovedAt] = useState(
    assessment.approvedAt ? new Date(assessment.approvedAt).toISOString().slice(0, 10) : ""
  );
  const [reviewedById, setReviewedById] = useState(assessment.reviewedById ?? NO_USER);
  const [reviewedAt, setReviewedAt] = useState(
    assessment.reviewedAt ? new Date(assessment.reviewedAt).toISOString().slice(0, 10) : ""
  );

  const approvedByUser = users.find((u) => u.id === assessment.approvedById);
  const reviewedByUser = users.find((u) => u.id === assessment.reviewedById);

  const isCompliant =
    !!assessment.participants &&
    !!assessment.approvedById &&
    !!assessment.approvedAt;

  async function handleSave() {
    setLoading(true);
    try {
      const result = await updateRiskAssessment({
        id: assessment.id,
        participants: participants || undefined,
        approvedById: approvedById === NO_USER ? null : approvedById,
        approvedAt: approvedAt || null,
        reviewedById: reviewedById === NO_USER ? null : reviewedById,
        reviewedAt: reviewedAt || null,
      });

      if (result.success) {
        toast({ title: "Saved", description: "Documentation requirements updated.", className: "bg-green-50 border-green-200" });
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

  return (
    <Card className={`border-l-4 ${isCompliant ? "border-l-green-500" : "border-l-amber-400"}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm sm:text-base">
              Documentation requirements (MHSWR 1999 reg.3)
            </CardTitle>
            {isCompliant ? (
              <span className="flex items-center gap-1 rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle2 className="h-3 w-3" /> Documented
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 border border-amber-300 px-2 py-0.5 text-xs font-medium text-amber-800">
                Missing documentation
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
            <div className="space-y-2">
              <Label>
                Assessment participants *
                <span className="ml-1 text-xs font-normal text-muted-foreground">(MHSWR 1999 reg.3, SRSCWR 1977)</span>
              </Label>
              <Textarea
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="e.g. Jane Smith (HSE Manager), John Brown (Safety Representative), Sarah Green (Line Manager)"
                rows={2}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Record who participated — safety representatives should be consulted (SRSCWR 1977 reg.4A, HSCER 1996 reg.3).
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Approved by *
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(MHSWR 1999 reg.3)</span>
                </Label>
                <Select value={approvedById} onValueChange={setApprovedById} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_USER}>— Not set —</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Approval date *</Label>
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
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(MHSWR 1999 reg.3(3))</span>
                </Label>
                <Select value={reviewedById} onValueChange={setReviewedById} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_USER}>— Not set —</SelectItem>
                    {users.map((u) => (
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
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                <Users className="h-3.5 w-3.5" /> Participants
              </div>
              {assessment.participants ? (
                <p className="text-sm">{assessment.participants}</p>
              ) : (
                <p className="text-sm text-amber-600 italic">Not documented</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved
              </div>
              {approvedByUser && assessment.approvedAt ? (
                <>
                  <p className="text-sm font-medium">{approvedByUser.name || approvedByUser.email}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(assessment.approvedAt)}</p>
                </>
              ) : (
                <p className="text-sm text-amber-600 italic">Not approved</p>
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
        )}
      </CardContent>
    </Card>
  );
}
