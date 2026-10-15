"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateRiskAssessment } from "@/server/actions/risk.actions";
import { Pencil, X } from "lucide-react";

interface RiskAssessmentTitleEditorProps {
  assessmentId: string;
  initialTitle: string;
  canEdit: boolean;
}

export function RiskAssessmentTitleEditor({
  assessmentId,
  initialTitle,
  canEdit,
}: RiskAssessmentTitleEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
    if (!editing) {
      setDraft(initialTitle);
    }
  }, [initialTitle, editing]);

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(title);
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 3) {
      toast({
        variant: "destructive",
        title: "Title is too short",
        description: "The title must be at least 3 characters.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateRiskAssessment({
        id: assessmentId,
        title: trimmed,
      });

      if (result.success) {
        setTitle(trimmed);
        setEditing(false);
        toast({
          title: "Title updated",
          description: "The risk assessment has a new title.",
          className: "bg-green-50 border-green-200",
        });
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Could not save", description: result.error });
      }
    } catch {
      toast({ variant: "destructive", title: "Could not save", description: "Try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return <h1 className="text-3xl font-bold">{title}</h1>;
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-start gap-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Button type="button" variant="outline" size="sm" className="shrink-0 mt-1" onClick={startEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Change title
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="assessment-title-edit">Risk assessment title</Label>
        <Input
          id="assessment-title-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          disabled={loading}
          placeholder="e.g. Risk assessment 2026"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save title"}
        </Button>
        <Button type="button" variant="ghost" onClick={cancelEdit} disabled={loading}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
