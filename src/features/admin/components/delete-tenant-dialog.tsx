"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTenant } from "@/server/actions/tenant.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface DeleteTenantDialogProps {
  tenantId: string;
  tenantName: string;
  tenantStatus: "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED";
  isDemo?: boolean;
  counts: {
    users: number;
    documents: number;
    incidents: number;
    risks: number;
  };
}

export function DeleteTenantDialog({
  tenantId,
  tenantName,
  tenantStatus,
  isDemo = false,
  counts,
}: DeleteTenantDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = isDemo || tenantStatus === "CANCELLED" || tenantStatus === "SUSPENDED";
  const isConfirmed = confirmText === tenantName;
  const title = isDemo ? "Delete demo workspace" : "Delete organisation permanently";

  async function handleDelete() {
    if (!isConfirmed) {
      toast({
        variant: "destructive",
        title: "Confirmation missing",
        description: `Type the organisation name exactly: "${tenantName}"`,
      });
      return;
    }

    setIsDeleting(true);

    const result = await deleteTenant(tenantId, confirmText);

    if (result.success) {
      toast({
        title: isDemo ? "Demo deleted" : "Organisation deleted",
        description: result.message,
      });
      setIsOpen(false);
      router.push("/admin/tenants");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: result.error,
      });
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={!canDelete} className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          {isDemo ? "Delete demo" : "Delete organisation permanently"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-base font-semibold text-foreground">
              Delete “{tenantName}”? This cannot be undone.
            </div>

            <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive">This permanently removes:</p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm">
                <li>
                  <strong>{counts.users}</strong> users
                </li>
                <li>
                  <strong>{counts.documents}</strong> documents
                </li>
                <li>
                  <strong>{counts.incidents}</strong> accident book entries
                </li>
                <li>
                  <strong>{counts.risks}</strong> risk assessments
                </li>
                <li>Procedures, training, audits and related records</li>
                <li>Invoices and stored files</li>
              </ul>
            </div>

            {!canDelete && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-sm font-semibold">Cannot delete an active organisation</p>
                <p className="mt-1 text-sm">
                  Change status to SUSPENDED or CANCELLED first. Demo workspaces can be deleted while they are still on trial.
                </p>
              </div>
            )}

            {canDelete && (
              <div className="space-y-2 pt-4">
                <Label htmlFor="confirmText" className="text-base">
                  Type the organisation name to confirm:
                </Label>
                <Input
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={tenantName}
                  disabled={isDeleting}
                  className="font-mono"
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={!canDelete || !isConfirmed || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
