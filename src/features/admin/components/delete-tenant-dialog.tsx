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
  counts,
}: DeleteTenantDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canDelete = tenantStatus === "CANCELLED" || tenantStatus === "SUSPENDED";
  const isConfirmed = confirmText === tenantName;

  async function handleDelete() {
    if (!isConfirmed) {
      toast({
        variant: "destructive",
        title: "❌ Bekreftelse mangler",
        description: `Skriv inn bedriftsnavnet nøyaktig: "${tenantName}"`,
      });
      return;
    }

    setIsDeleting(true);

    const result = await deleteTenant(tenantId, confirmText);

    if (result.success) {
      toast({
        title: "✅ Bedrift slettet",
        description: result.message,
      });
      setIsOpen(false);
      router.push("/admin/tenants");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "❌ Kunne ikke slette bedrift",
        description: result.error,
      });
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={!canDelete}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Slett bedrift permanent
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Slett bedrift permanent
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-base font-semibold text-foreground">
              Er du helt sikker på at du vil slette "{tenantName}"?
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-destructive">⚠️ ADVARSEL: Denne handlingen kan ikke angres!</p>
              <p className="text-sm">Dette vil permanent slette:</p>
              <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                <li><strong>{counts.users}</strong> brukere</li>
                <li><strong>{counts.documents}</strong> dokumenter</li>
                <li><strong>{counts.incidents}</strong> avvik</li>
                <li><strong>{counts.risks}</strong> risikovurderinger</li>
                <li>Alle skjemaer, opplæring, revisjoner og mål</li>
                <li>Alle fakturaer og betalingshistorikk</li>
                <li><strong>Alle filer lagret i R2 Cloud</strong></li>
              </ul>
            </div>

            {!canDelete && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-sm font-semibold">
                  ⚠️ Kan ikke slette aktive bedrifter
                </p>
                <p className="text-sm mt-1">
                  Endre status til "SUSPENDED" eller "CANCELLED" før sletting.
                </p>
              </div>
            )}

            {canDelete && (
              <div className="space-y-2 pt-4">
                <Label htmlFor="confirmText" className="text-base">
                  Skriv inn bedriftsnavnet for å bekrefte sletting:
                </Label>
                <Input
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={tenantName}
                  disabled={isDeleting}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Skriv inn: <code className="bg-muted px-1 py-0.5 rounded">{tenantName}</code>
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={!canDelete || !isConfirmed || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ja, slett permanent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

