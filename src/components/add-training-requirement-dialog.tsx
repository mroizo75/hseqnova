"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { addTrainingRequirementToRisk } from "@/server/actions/risk-training.actions";
import { Loader2 } from "lucide-react";

interface AddTrainingRequirementDialogProps {
  riskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTrainingRequirementDialog({
  riskId,
  open,
  onOpenChange,
}: AddTrainingRequirementDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [formData, setFormData] = useState({
    courseKey: "",
    isMandatory: true,
    reason: "",
  });

  useEffect(() => {
    if (open) {
      loadCourses();
    }
  }, [open]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await fetch("/api/training/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.courseKey) {
      toast({
        variant: "destructive",
        title: "Feil",
        description: "Velg et kurs",
      });
      return;
    }

    setLoading(true);

    const result = await addTrainingRequirementToRisk({
      riskId,
      ...formData,
    });

    if (result.success) {
      toast({
        title: "✅ Opplæringskrav lagt til",
        description: "Kurset er nå påkrevd for denne risikoen",
        className: "bg-green-50 border-green-200",
      });
      setFormData({
        courseKey: "",
        isMandatory: true,
        reason: "",
      });
      onOpenChange(false);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Feil",
        description: result.error || "Kunne ikke legge til opplæringskrav",
      });
    }

    setLoading(false);
  };

  const selectedCourse = courses.find((c) => c.courseKey === formData.courseKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til opplæringskrav</DialogTitle>
          <DialogDescription>
            Definer påkrevd opplæring for å håndtere denne risikoen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course">Kurs</Label>
            {loadingCourses ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Select
                value={formData.courseKey}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseKey: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg kurs" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.courseKey} value={course.courseKey}>
                      {course.title}
                      {course.isGlobal && " (Standard)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedCourse && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">
                {selectedCourse.description}
              </p>
              {selectedCourse.duration && (
                <p className="text-muted-foreground mt-1">
                  Varighet: {selectedCourse.duration} timer
                </p>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMandatory"
              checked={formData.isMandatory}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isMandatory: checked as boolean })
              }
            />
            <Label htmlFor="isMandatory" className="cursor-pointer">
              Obligatorisk opplæring
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Begrunnelse (valgfritt)</Label>
            <Textarea
              id="reason"
              placeholder="F.eks. 'EU REACH Annex XVII - Diisocyanater', 'ISO 45001 krav', etc."
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={loading || loadingCourses}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Legg til
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
