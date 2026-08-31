"use client";

import { useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createBulkTrainings } from "@/server/actions/training.actions";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  FileText,
  Loader2,
  Zap,
} from "lucide-react";
import type { CourseTemplate } from "@prisma/client";
import {
  MHSWR_TRAINING_REASON_KEYS,
  MHSWR_TRAINING_REASONS,
} from "@/lib/training-uk";

interface BulkTrainingFormProps {
  tenantId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  courseTemplates: CourseTemplate[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ParticipantRow {
  userId: string;
  name: string;
  file: File | null;
  uploadedKey: string | null;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, label: "Course" },
  { id: 2, label: "People" },
  { id: 3, label: "Certificates" },
  { id: 4, label: "Confirm" },
];

export function BulkTrainingForm({
  tenantId,
  users,
  courseTemplates,
  open: controlledOpen,
  onOpenChange,
}: BulkTrainingFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Step 1 state
  const [courseKey, setCourseKey] = useState("");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [completedAt, setCompletedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [validUntil, setValidUntil] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [mhswrReason, setMhswrReason] = useState("");

  // Step 2 state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Step 3 state — map userId → file
  const [diplomaFiles, setDiplomaFiles] = useState<Map<string, File>>(new Map());

  const selectedCourse = courseTemplates.find((c) => c.courseKey === courseKey);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleFileChange = (userId: string, file: File | null) => {
    setDiplomaFiles((prev) => {
      const next = new Map(prev);
      if (file) {
        next.set(userId, file);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const handleCourseChange = (value: string) => {
    setCourseKey(value);
    const course = courseTemplates.find((c) => c.courseKey === value);
    if (course) {
      setTitle(course.title);
      setProvider(course.provider || "");
      setIsRequired(course.isRequired);
      if (course.validityYears) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + course.validityYears);
        setValidUntil(d.toISOString().split("T")[0]);
      } else {
        setValidUntil("");
      }
    }
  };

  const resetForm = () => {
    setStep(1);
    setCourseKey("");
    setTitle("");
    setProvider("");
    setCompletedAt(new Date().toISOString().split("T")[0]);
    setValidUntil("");
    setIsRequired(false);
    setMhswrReason("");
    setSelectedUserIds(new Set());
    setDiplomaFiles(new Map());
    setSearch("");
  };

  const handleClose = (value: boolean) => {
    if (!value) resetForm();
    setOpen(value);
  };

  const canProceedStep1 =
    courseKey.trim().length > 0 &&
    title.trim().length >= 3 &&
    provider.trim().length >= 2 &&
    mhswrReason.length > 0;

  const canProceedStep2 = selectedUserIds.size > 0;

  const uploadDiploma = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/training/upload", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.key ?? null;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const participantKeys = new Map<string, string | undefined>();

      // Last opp alle diplomer parallelt
      const uploadTasks = Array.from(selectedUserIds).map(async (userId) => {
        const file = diplomaFiles.get(userId);
        if (file) {
          const key = await uploadDiploma(file);
          participantKeys.set(userId, key ?? undefined);
        } else {
          participantKeys.set(userId, undefined);
        }
      });
      await Promise.all(uploadTasks);

      const participants = Array.from(selectedUserIds).map((userId) => ({
        userId,
        proofDocKey: participantKeys.get(userId),
      }));

      const result = await createBulkTrainings({
        tenantId,
        courseKey,
        title,
        provider,
        completedAt: completedAt || undefined,
        validUntil: validUntil || undefined,
        isRequired,
        mhswrReason,
        participants,
      });

      if (result.success) {
        toast({
          title: "Training recorded",
          description: `${selectedUserIds.size} employees were recorded for ${title}`,
          className: "bg-green-50 border-green-200",
        });
        handleClose(false);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not record the training",
          description: result.error || "Could not record the training",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Something went wrong while saving",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUsersArray = Array.from(selectedUserIds).map(
    (id) => users.find((u) => u.id === id)!
  ).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="default">
            <Zap className="mr-2 h-4 w-4" />
            Add for a group
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Record one course for several employees
          </DialogTitle>
          <DialogDescription>
            Use this when a group completed the same course on the same day.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                  step > s.id
                    ? "bg-green-600 text-white"
                    : step === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`ml-1 text-xs hidden sm:inline ${
                  step === s.id ? "font-semibold" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Kursinformasjon ─── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select value={courseKey} onValueChange={handleCourseChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course template..." />
                </SelectTrigger>
                <SelectContent>
                  {courseTemplates.map((c) => (
                    <SelectItem key={c.id} value={c.courseKey}>
                      {c.title}
                      {c.isGlobal && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          (standard H&S)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom course</SelectItem>
                </SelectContent>
              </Select>
              {selectedCourse?.description && (
                <p className="text-xs text-muted-foreground">
                  {selectedCourse.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. First aid"
              />
            </div>

            <div className="space-y-2">
              <Label>Provider *</Label>
              <Input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. St John Ambulance"
              />
            </div>

            <div className="space-y-2">
              <Label>Why this training was given *</Label>
              <Select value={mhswrReason} onValueChange={setMhswrReason}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Completed date</Label>
                <Input
                  type="date"
                  value={completedAt}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCompletedAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid until</Label>
                <Input
                  type="date"
                  value={validUntil}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank if the course does not expire
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isRequired"
                checked={isRequired}
                onCheckedChange={(v) => setIsRequired(!!v)}
              />
              <Label htmlFor="isRequired" className="font-normal cursor-pointer">
                Required course for all selected employees
              </Label>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Velg deltakere ─── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent p-0 focus-visible:ring-0 h-auto"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-primary underline underline-offset-2"
              >
                {selectedUserIds.size === filteredUsers.length
                  ? "Clear all"
                  : "Select all"}
              </button>
              <span className="text-xs text-muted-foreground">
                {selectedUserIds.size} of {users.length} selected
              </span>
            </div>

            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No employees found
                </p>
              )}
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u.id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedUserIds.has(u.id)}
                    onCheckedChange={() => toggleUser(u.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {u.name || u.email}
                    </p>
                    {u.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </p>
                    )}
                  </div>
                  {selectedUserIds.has(u.id) && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {selectedUserIds.size > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedUsersArray.slice(0, 5).map((u) => (
                  <Badge
                    key={u.id}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs"
                  >
                    {u.name || u.email}
                    <button
                      type="button"
                      onClick={() => toggleUser(u.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedUsersArray.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedUsersArray.length - 5} til
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3: Last opp diplomer ─── */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload a certificate for each person if you have it. You can skip anyone who does not have a file yet.
            </p>

            <div className="border rounded-lg divide-y max-h-[420px] overflow-y-auto">
              {selectedUsersArray.map((u) => {
                const file = diplomaFiles.get(u.id) ?? null;
                return (
                  <div key={u.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.name || u.email}
                        </p>
                        {u.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </p>
                        )}
                      </div>
                      {file ? (
                        <div className="flex items-center gap-1 text-green-600 shrink-0 ml-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs max-w-32 truncate">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFileChange(u.id, null)}
                            className="hover:text-destructive ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          Intet diplom
                        </span>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="flex items-center gap-2 text-xs text-primary border border-dashed border-primary/40 rounded px-3 py-1.5 hover:bg-primary/5 transition-colors w-full justify-center">
                        <Upload className="h-3 w-3" />
                        {file ? "Change file" : "Upload certificate (PDF or image)"}
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="sr-only"
                        onChange={(e) =>
                          handleFileChange(u.id, e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              {diplomaFiles.size} av {selectedUserIds.size} har diplomfil klar
            </p>
          </div>
        )}

        {/* ─── STEP 4: Bekreft ─── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h3 className="font-semibold text-sm">Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium">{title}</span>

                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium">{provider}</span>

                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {completedAt
                    ? new Date(completedAt).toLocaleDateString("en-GB")
                    : "Not set"}
                </span>

                {validUntil && (
                  <>
                    <span className="text-muted-foreground">Valid until</span>
                    <span className="font-medium">
                      {new Date(validUntil).toLocaleDateString("en-GB")}
                    </span>
                  </>
                )}

                <span className="text-muted-foreground">People</span>
                <span className="font-semibold text-primary">
                  {selectedUserIds.size} employees
                </span>

                <span className="text-muted-foreground">Certificates uploaded</span>
                <span className="font-medium">
                  {diplomaFiles.size} av {selectedUserIds.size}
                </span>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {selectedUsersArray.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span className="text-sm">{u.name || u.email}</span>
                  {diplomaFiles.has(u.id) ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FileText className="h-3 w-3" />
                      <span className="text-xs">File ready</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Uten diplom
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
              This will create{" "}
              <strong>{selectedUserIds.size} training records</strong>.
              Certificates are uploaded and attached to the right employee.
            </p>
          </div>
        )}

        {/* Navigasjonsknapper */}
        <div className="flex justify-between pt-2 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => (step === 1 ? handleClose(false) : setStep((s) => (s - 1) as Step))}
            disabled={loading}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2)
              }
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="min-w-36"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save {selectedUserIds.size} records
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
