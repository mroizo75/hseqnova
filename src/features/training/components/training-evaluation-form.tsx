"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { evaluateTraining } from "@/server/actions/training.actions";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck } from "lucide-react";

interface TrainingEvaluationFormProps {
  trainingId: string;
  trainingTitle: string;
  userId: string;
  trigger?: React.ReactNode;
}

export function TrainingEvaluationForm({
  trainingId,
  trainingTitle,
  userId,
  trigger,
}: TrainingEvaluationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const effectiveness = formData.get("effectiveness") as string;

    const result = await evaluateTraining({
      id: trainingId,
      effectiveness,
      evaluatedBy: userId,
    });

    if (result.success) {
      toast({
        title: "Review recorded",
        description: "Whether the training was effective is now on the record",
        className: "bg-green-50 border-green-200",
      });
      setOpen(false);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save the review",
        description: result.error || "The review could not be saved",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Review effectiveness
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Was the training effective?</DialogTitle>
          <DialogDescription>
            HSE: ask whether the training is relevant and effective, and whether
            refresher training is needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">Course: {trainingTitle}</p>

          <div className="space-y-2">
            <Label htmlFor="effectiveness">Review *</Label>
            <Textarea
              id="effectiveness"
              name="effectiveness"
              rows={6}
              placeholder="Does the employee understand what is required? Are they working as trained? Is further training needed?"
              required
              disabled={loading}
              minLength={20}
            />
            <p className="text-sm text-muted-foreground">At least 20 characters.</p>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
