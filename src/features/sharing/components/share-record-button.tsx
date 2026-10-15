"use client";

import { useState } from "react";
import { Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createRecordShare } from "@/server/actions/record-share.actions";
import type { RecordShareKind } from "@/lib/record-share";

interface ShareRecordButtonProps {
  recordType: RecordShareKind;
  recordId: string;
  recordTitle: string;
  appearance?: "button" | "icon";
}

export function ShareRecordButton({
  recordType,
  recordId,
  recordTitle,
  appearance = "button",
}: ShareRecordButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const personalData = recordType === "INCIDENT";

  const submit = async (sendEmail: boolean) => {
    if (sendEmail && !email.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Enter the address that should receive the link.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createRecordShare({
        recordType,
        recordId,
        recipientEmail: sendEmail ? email.trim() : "",
        note,
      });
      if ("error" in result) {
        toast({ variant: "destructive", title: "Could not share", description: result.error });
        return;
      }
      setShareUrl(result.data.url);
      if (result.data.emailError) {
        toast({
          variant: "destructive",
          title: "Link created",
          description: result.data.emailError,
        });
      } else if (result.data.emailed) {
        toast({ title: "Email sent", description: "The recipient can sign in and import the record." });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied" });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setShareUrl(null);
          setLoading(false);
        }
      }}
    >
      <DialogTrigger asChild>
        {appearance === "icon" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Share"
            onClick={(event) => event.stopPropagation()}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="outline" className="bg-transparent" onClick={(event) => event.stopPropagation()}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {recordTitle}</DialogTitle>
          <DialogDescription>
            Send a link by email, or copy it so another HSEQ Nova organisation can import a copy.
            The original stays here. The link expires in 14 days and can be imported once.
          </DialogDescription>
        </DialogHeader>

        {personalData ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            This incident may contain personal data from the accident book. Send it only to the
            employer who must keep the record.
          </p>
        ) : null}

        {shareUrl ? (
          <div className="space-y-3">
            <Label htmlFor="share-url">Share link</Label>
            <Input id="share-url" readOnly value={shareUrl} />
            <Button type="button" onClick={copyLink}>
              Copy link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email</Label>
              <Input
                id="share-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="customer@example.co.uk"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-note">Note</Label>
              <Textarea
                id="share-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note for the recipient"
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="bg-transparent" disabled={loading} onClick={() => submit(false)}>
                <Share2 className="mr-2 h-4 w-4" />
                {loading ? "Creating…" : "Create link"}
              </Button>
              <Button type="button" disabled={loading} onClick={() => submit(true)}>
                <Mail className="mr-2 h-4 w-4" />
                {loading ? "Sending…" : "Email link"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
