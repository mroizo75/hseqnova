"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ApproveManagementReviewButtonProps {
  reviewId: string;
  canApprove: boolean;
  documentsCount: number;
}

export function ApproveManagementReviewButton({
  reviewId,
  canApprove,
  documentsCount,
}: ApproveManagementReviewButtonProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await fetch(`/api/management-reviews/${reviewId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke godkjenne gjennomgangen");
      }

      toast.success("Gjennomgang godkjent!", {
        description: `${data.documentsUpdated} dokumenter oppdatert med ny gjennomgangsdato`,
      });

      router.refresh();
    } catch (error: any) {
      toast.error("Feil ved godkjenning", {
        description: error.message,
      });
    } finally {
      setApproving(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="bg-green-600 hover:bg-green-700"
          disabled={!canApprove || approving}
        >
          {approving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Godkjenner...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Godkjenn gjennomgang
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Godkjenn ledelsens gjennomgang?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Dette vil godkjenne ledelsens gjennomgang og oppdatere alle tilknyttede dokumenter.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mt-3">
              <p className="text-sm text-blue-900 font-medium">
                📋 {documentsCount} dokument(er) vil bli:
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                <li>Satt til status "Godkjent"</li>
                <li>Tildelt ny gjennomgangsdato basert på deres intervall</li>
                <li>Registrert med deg som godkjenner</li>
              </ul>
            </div>
            {!canApprove && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ Gjennomgangen må være i status "Fullført" før den kan godkjennes.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={!canApprove}
            className="bg-green-600 hover:bg-green-700"
          >
            Godkjenn
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
