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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTraining } from "@/server/actions/training.actions";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { CourseTemplate } from "@prisma/client";
import {
  MHSWR_TRAINING_REASON_KEYS,
  MHSWR_TRAINING_REASONS,
} from "@/lib/training-uk";
import { TrainingLegalNote } from "@/features/training/components/training-legal-note";

interface TrainingFormProps {
  tenantId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  courseTemplates: CourseTemplate[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TrainingForm({ tenantId, users, courseTemplates, trigger, open: controlledOpen, onOpenChange }: TrainingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [mhswrReason, setMhswrReason] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadCertificate = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/training/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const json = await res.json();
    return json.key ?? null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      let proofDocKey: string | undefined;
      if (selectedFile) {
        const key = await uploadCertificate(selectedFile);
        if (!key) {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: "The certificate could not be uploaded. Try again.",
          });
          setLoading(false);
          return;
        }
        proofDocKey = key;
      }

      const data = {
        tenantId,
        userId: formData.get("userId") as string,
        courseKey: formData.get("courseKey") as string,
        title: formData.get("title") as string,
        provider: formData.get("provider") as string,
        completedAt: (formData.get("completedAt") as string) || undefined,
        validUntil: (formData.get("validUntil") as string) || undefined,
        isRequired: formData.get("isRequired") === "true",
        mhswrReason,
        proofDocKey,
      };

      const result = await createTraining(data);

      if (result.success) {
        toast({
          title: "Training recorded",
          description: "The course is now on the employee’s record",
          className: "bg-green-50 border-green-200",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not record training",
          description: result.error || "The record could not be saved",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseInfo = courseTemplates.find((c) => c.courseKey === selectedCourse);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record training
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record training</DialogTitle>
          <DialogDescription>
            Who was trained, in what, when, and why — HSWA 1974 s.2(2)(c) / MHSWR 1999 reg.13.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="userId">Employee *</Label>
              <Select name="userId" required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseKey">Course *</Label>
              <Select
                name="courseKey"
                required
                disabled={loading}
                value={selectedCourse}
                onValueChange={(value) => {
                  setSelectedCourse(value);
                  const course = courseTemplates.find((c) => c.courseKey === value);
                  if (course) {
                    const form = document.querySelector("form") as HTMLFormElement;
                    const titleInput = form?.querySelector('[name="title"]') as HTMLInputElement;
                    if (titleInput) titleInput.value = course.title;
                    const providerInput = form?.querySelector('[name="provider"]') as HTMLInputElement;
                    if (providerInput && course.provider) providerInput.value = course.provider;
                    if (course.validityYears) {
                      const completedInput = form?.querySelector('[name="completedAt"]') as HTMLInputElement;
                      const baseDate = completedInput?.value ? new Date(completedInput.value) : new Date();
                      const validDate = new Date(baseDate);
                      validDate.setFullYear(validDate.getFullYear() + course.validityYears);
                      const validInput = form?.querySelector('[name="validUntil"]') as HTMLInputElement;
                      if (validInput) validInput.value = validDate.toISOString().split("T")[0];
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courseTemplates.map((course) => (
                    <SelectItem key={course.id} value={course.courseKey}>
                      {course.title}
                      {course.isGlobal && " (standard H&S)"}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom course</SelectItem>
                </SelectContent>
              </Select>
              {selectedCourseInfo && (
                <p className="text-xs text-muted-foreground">{selectedCourseInfo.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Course title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. First aid"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Input
              id="provider"
              name="provider"
              placeholder="e.g. St John Ambulance, in-house"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Why this training was given *</Label>
            <Select value={mhswrReason} onValueChange={setMhswrReason} required disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="MHSWR 1999 reg.13 — recruitment, new risk, or refresher" />
              </SelectTrigger>
              <SelectContent>
                {MHSWR_TRAINING_REASON_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {MHSWR_TRAINING_REASONS[key].label} ({MHSWR_TRAINING_REASONS[key].legalRef})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="completedAt">Completed date</Label>
              <Input
                id="completedAt"
                name="completedAt"
                type="date"
                disabled={loading}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid until</Label>
              <Input
                id="validUntil"
                name="validUntil"
                type="date"
                disabled={loading}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if the course does not expire
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proofDoc">Certificate or other evidence</Label>
            <Input
              id="proofDoc"
              name="proofDoc"
              type="file"
              disabled={loading}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isRequired"
              name="isRequired"
              value="true"
              disabled={loading}
              className="h-4 w-4"
            />
            <Label htmlFor="isRequired" className="font-normal">
              Required for all employees
            </Label>
          </div>

          <TrainingLegalNote />

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !mhswrReason}>
              {loading ? "Saving..." : "Record training"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
