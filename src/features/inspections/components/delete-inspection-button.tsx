"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface DeleteInspectionButtonProps {
  inspectionId: string;
  inspectionTitle: string;
}

export function DeleteInspectionButton({
  inspectionId,
  inspectionTitle,
}: DeleteInspectionButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Could not delete the inspection");
      }

      toast({
        title: "Inspection deleted",
        description: `"${inspectionTitle}" has been permanently deleted.`,
      });

      setOpen(false);
      router.push("/dashboard/inspections");
      router.refresh();
    } catch (error: unknown) {
      toast({
        title: "Could not delete",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete inspection record</DialogTitle>
          <DialogDescription className="space-y-2 pt-1">
            <span className="block">
              Are you sure you want to delete{" "}
              <strong>&ldquo;{inspectionTitle}&rdquo;</strong>?
            </span>
            <span className="block text-destructive font-medium">
              This permanently deletes the inspection and all findings. This cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {loading ? "Deleting…" : "Yes, delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
