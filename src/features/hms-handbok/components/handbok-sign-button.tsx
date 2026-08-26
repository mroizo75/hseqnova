"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PenLine, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signHandbook } from "@/server/actions/hms-handbok.actions";

interface HandbokSignButtonProps {
  tenantId: string;
  alreadySigned: boolean;
  versionId?: string;
}

export function HandbokSignButton({ tenantId, alreadySigned, versionId }: HandbokSignButtonProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSign() {
    setLoading(true);
    const result = await signHandbook({ tenantId, versionId, comment: comment.trim() || undefined });
    setLoading(false);
    if (result.success) {
      toast({ title: "Notification recorded", description: "You have confirmed you have been shown this policy." });
      setOpen(false);
      setComment("");
    } else {
      toast({ title: "Feil", description: result.error, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={alreadySigned ? "outline" : "default"} size="sm" className="gap-2">
          <PenLine className="h-4 w-4" />
          {alreadySigned ? "Notified again" : "I have been notified"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm you have been notified</DialogTitle>
          <DialogDescription>
            HSWA 1974 s.2(3) requires the employer to bring this policy to your notice. This is not
            an approval of the policy. It records that you have been shown the current written policy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="comment">Comment (optional)</Label>
          <Textarea
            id="comment"
            placeholder="e.g. Reviewed at the H&S meeting on 11 Aug 2026"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSign} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm I have been notified
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
