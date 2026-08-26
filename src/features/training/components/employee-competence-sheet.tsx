"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getTrainingStatus,
  getTrainingStatusColor,
  getTrainingStatusLabel,
} from "@/features/training/schemas/training.schema";
import { AttachPersonnelDocumentDialog } from "@/features/training/components/attach-personnel-document-dialog";
import { EditTrainingDialog } from "@/features/training/components/edit-training-dialog";
import { formatTrainingDate } from "@/lib/training-uk";
import { FileText, Loader2, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Training } from "@prisma/client";

type TrainingRow = Training & { user?: { id: string; name: string | null; email: string } };

interface EmployeeCompetenceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  employee: { id: string; name: string | null; email: string } | null;
  trainings: TrainingRow[];
  missingRequired: number;
  onAddCompetence: () => void;
}

export function EmployeeCompetenceSheet({
  open,
  onOpenChange,
  tenantId,
  employee,
  trainings,
  missingRequired,
  onAddCompetence,
}: EmployeeCompetenceSheetProps) {
  const { toast } = useToast();
  const [certLoading, setCertLoading] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);

  const name = employee?.name || employee?.email || "Employee";

  const handleViewCertificate = async (id: string) => {
    setCertLoading(id);
    try {
      const res = await fetch(`/api/training/${id}/certificate`);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Certificate not found", description: "No file is attached to this record." });
        return;
      }
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ variant: "destructive", title: "Could not open file", description: "Try again." });
    } finally {
      setCertLoading(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{name}</SheetTitle>
            <SheetDescription>
              {employee?.email}
              {missingRequired > 0
                ? ` · ${missingRequired} required course${missingRequired === 1 ? "" : "s"} missing`
                : " · Competence file"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={onAddCompetence}>
              <Plus className="mr-2 h-4 w-4" />
              Add courses
            </Button>
            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setAttachOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Attach CV or diploma
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            {trainings.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nothing on file yet. Add courses or attach a CV.
              </p>
            ) : (
              trainings.map((training) => {
                const status = getTrainingStatus(training);
                return (
                  <div key={training.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/dashboard/training/${training.id}`} className="font-medium hover:underline">
                          {training.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {training.provider}
                          {training.completedAt ? ` · ${formatTrainingDate(training.completedAt)}` : ""}
                          {training.validUntil ? ` · valid until ${formatTrainingDate(training.validUntil)}` : ""}
                        </p>
                      </div>
                      <Badge className={getTrainingStatusColor(status)}>{getTrainingStatusLabel(status)}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1">
                      {training.proofDocKey ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCertificate(training.id)}
                          disabled={certLoading === training.id}
                          aria-label="Open attached file"
                        >
                          {certLoading === training.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      ) : null}
                      <EditTrainingDialog training={training} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {employee ? (
        <AttachPersonnelDocumentDialog
          open={attachOpen}
          onOpenChange={setAttachOpen}
          tenantId={tenantId}
          userId={employee.id}
          employeeName={name}
        />
      ) : null}
    </>
  );
}
