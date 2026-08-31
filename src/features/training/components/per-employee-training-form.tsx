"use client";

import { useState, useId, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createEmployeeTrainings } from "@/server/actions/training.actions";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Plus,
  Trash2,
  Upload,
  FileText,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";
import type { CourseTemplate } from "@prisma/client";
import {
  MHSWR_TRAINING_REASON_KEYS,
  MHSWR_TRAINING_REASONS,
} from "@/lib/training-uk";

interface PerEmployeeTrainingFormProps {
  tenantId: string;
  users: Array<{ id: string; name: string | null; email: string }>;
  courseTemplates: CourseTemplate[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preselectedUserId?: string;
}

interface CourseRow {
  rowId: string;
  courseKey: string;
  title: string;
  provider: string;
  completedAt: string;
  validUntil: string;
  isRequired: boolean;
  mhswrReason: string;
  file: File | null;
}

type Step = 1 | 2 | 3;

function makeRow(id: string): CourseRow {
  return {
    rowId: id,
    courseKey: "",
    title: "",
    provider: "",
    completedAt: new Date().toISOString().split("T")[0],
    validUntil: "",
    isRequired: false,
    mhswrReason: "",
    file: null,
  };
}

export function PerEmployeeTrainingForm({
  tenantId,
  users,
  courseTemplates,
  open: controlledOpen,
  onOpenChange,
  preselectedUserId,
}: PerEmployeeTrainingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const baseId = useId();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [rows, setRows] = useState<CourseRow[]>([makeRow(`${baseId}-0`)]);
  const [counter, setCounter] = useState(1);

  useEffect(() => {
    if (open && preselectedUserId) {
      setSelectedUserId(preselectedUserId);
      setStep(2);
    }
  }, [open, preselectedUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const addRow = () => {
    setRows((prev) => [...prev, makeRow(`${baseId}-${counter}`)]);
    setCounter((c) => c + 1);
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  const updateRow = (rowId: string, patch: Partial<CourseRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r))
    );
  };

  const handleCourseSelect = (rowId: string, courseKey: string) => {
    const course = courseTemplates.find((c) => c.courseKey === courseKey);
    if (!course) {
      updateRow(rowId, { courseKey, title: "", provider: "", validUntil: "" });
      return;
    }
    let validUntil = "";
    if (course.validityYears) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + course.validityYears);
      validUntil = d.toISOString().split("T")[0];
    }
    updateRow(rowId, {
      courseKey,
      title: course.title,
      provider: course.provider || "",
      isRequired: course.isRequired,
      validUntil,
    });
  };

  const resetForm = () => {
    setStep(1);
    setSelectedUserId("");
    setUserSearch("");
    setRows([makeRow(`${baseId}-reset`)]);
    setCounter(1);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    setOpen(v);
  };

  const canProceedStep1 = !!selectedUserId;
  const canProceedStep2 = rows.every(
    (r) => r.courseKey && r.title.length >= 3 && r.provider.length >= 2 && r.mhswrReason
  ) && rows.length > 0;

  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/training/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const json = await res.json();
    return json.key ?? null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const courses = await Promise.all(
        rows.map(async (row) => {
          let proofDocKey: string | undefined = undefined;
          if (row.file) {
            const key = await uploadFile(row.file);
            proofDocKey = key ?? undefined;
          }
          return {
            courseKey: row.courseKey === "custom" ? `custom-${row.rowId}` : row.courseKey,
            title: row.title,
            provider: row.provider,
            completedAt: row.completedAt || undefined,
            validUntil: row.validUntil || undefined,
            isRequired: row.isRequired,
            mhswrReason: row.mhswrReason,
            proofDocKey,
          };
        })
      );

      const result = await createEmployeeTrainings({
        tenantId,
        userId: selectedUserId,
        courses,
      });

      if (result.success) {
        toast({
          title: "Competence recorded",
          description: `${rows.length} record${rows.length === 1 ? "" : "s"} added for ${selectedUser?.name || selectedUser?.email}`,
          className: "bg-green-50 border-green-200",
        });
        handleClose(false);
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not record competence",
          description: result.error || "The courses could not be saved",
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-transparent">
            <User className="mr-2 h-4 w-4" />
            Add for employee
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add competence for one employee
          </DialogTitle>
          <DialogDescription>
            Choose an employee, then attach courses, certificates and other evidence.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {(["1. Employee", "2. Courses", "3. Confirm"] as const).map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
                  step > i + 1
                    ? "bg-green-600 text-white"
                    : step === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > i + 1 ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={`ml-1 text-xs hidden sm:inline ${
                  step === i + 1 ? "font-semibold" : "text-muted-foreground"
                }`}
              >
                {label.split(". ")[1]}
              </span>
              {i < 2 && <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Velg ansatt ─── */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search employees..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="border-0 bg-transparent p-0 focus-visible:ring-0 h-auto"
              />
            </div>

            <div className="border rounded-lg divide-y max-h-72 overflow-y-auto">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selectedUserId === u.id
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
                    {(u.name || u.email)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                    {u.name && (
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    )}
                  </div>
                  {selectedUserId === u.id && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No employees found
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Legg til kurs ─── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Courses for{" "}
                <span className="font-semibold text-foreground">
                  {selectedUser?.name || selectedUser?.email}
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={loading}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add course
              </Button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {rows.map((row, idx) => (
                <div
                  key={row.rowId}
                  className="rounded-lg border p-3 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Course {idx + 1}
                    </span>
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeRow(row.rowId)}
                        disabled={loading}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Course template</Label>
                      <Select
                        value={row.courseKey}
                        onValueChange={(v) => handleCourseSelect(row.rowId, v)}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {courseTemplates.map((c) => (
                            <SelectItem key={c.id} value={c.courseKey}>
                              {c.title}
                              {c.isGlobal && (
                                <span className="text-muted-foreground ml-1 text-xs">
                                  (H&S)
                                </span>
                              )}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Title *</Label>
                      <Input
                        className="h-8 text-sm"
                        value={row.title}
                        onChange={(e) => updateRow(row.rowId, { title: e.target.value })}
                        placeholder="Title"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Provider *</Label>
                      <Input
                        className="h-8 text-sm"
                        value={row.provider}
                        onChange={(e) => updateRow(row.rowId, { provider: e.target.value })}
                        placeholder="e.g. St John Ambulance"
                        disabled={loading}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Why this training was given *</Label>
                      <Select
                        value={row.mhswrReason}
                        onValueChange={(v) => updateRow(row.rowId, { mhswrReason: v })}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="MHSWR 1999 reg.13" />
                        </SelectTrigger>
                        <SelectContent>
                          {MHSWR_TRAINING_REASON_KEYS.map((key) => (
                            <SelectItem key={key} value={key}>
                              {MHSWR_TRAINING_REASONS[key].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Completed</Label>
                      <Input
                        className="h-8 text-sm"
                        type="date"
                        value={row.completedAt}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => updateRow(row.rowId, { completedAt: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Valid until</Label>
                      <Input
                        className="h-8 text-sm"
                        type="date"
                        value={row.validUntil}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => updateRow(row.rowId, { validUntil: e.target.value })}
                        disabled={loading}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Certificate</Label>
                      {row.file ? (
                        <div className="flex items-center justify-between rounded border bg-blue-50 border-blue-200 px-2 py-1">
                          <div className="flex items-center gap-1.5 text-blue-700 min-w-0">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs truncate">{row.file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateRow(row.rowId, { file: null })}
                            className="text-muted-foreground hover:text-destructive ml-2 shrink-0"
                            disabled={loading}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          Upload certificate (optional)
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="sr-only"
                            onChange={(e) =>
                              updateRow(row.rowId, {
                                file: e.target.files?.[0] ?? null,
                              })
                            }
                            disabled={loading}
                          />
                        </label>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <Checkbox
                        id={`req-${row.rowId}`}
                        checked={row.isRequired}
                        onCheckedChange={(v) => updateRow(row.rowId, { isRequired: !!v })}
                        disabled={loading}
                      />
                      <Label
                        htmlFor={`req-${row.rowId}`}
                        className="text-xs font-normal cursor-pointer"
                      >
                        Required course
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={addRow}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add another course
            </Button>
          </div>
        )}

        {/* ─── STEP 3: Bekreft ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <h3 className="font-semibold text-sm">Summary</h3>
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="text-muted-foreground">Employee</span>
                <span className="font-medium">
                  {selectedUser?.name || selectedUser?.email}
                </span>
                <span className="text-muted-foreground">Courses</span>
                <span className="font-semibold text-primary">{rows.length}</span>
                <span className="text-muted-foreground">Files ready</span>
                <span className="font-medium">
                  {rows.filter((r) => r.file).length} of {rows.length}
                </span>
              </div>
            </div>

            <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
              {rows.map((row, idx) => (
                <div
                  key={row.rowId}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.provider}
                      {row.completedAt &&
                        ` · ${new Date(row.completedAt).toLocaleDateString("en-GB")}`}
                      {row.validUntil &&
                        ` → ${new Date(row.validUntil).toLocaleDateString("en-GB")}`}
                    </p>
                  </div>
                  {row.file ? (
                    <div className="flex items-center gap-1 text-green-600 shrink-0 ml-2">
                      <FileText className="h-3 w-3" />
                      <span className="text-xs">File</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      No file
                    </span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
              This will add{" "}
              <strong>{rows.length} record{rows.length === 1 ? "" : "s"}</strong> for{" "}
              <strong>{selectedUser?.name || selectedUser?.email}</strong>.
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

          {step < 3 ? (
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
                  Save {rows.length} record{rows.length === 1 ? "" : "s"}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
