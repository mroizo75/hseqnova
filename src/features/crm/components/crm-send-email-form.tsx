"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendCrmEmail } from "@/server/actions/crm.actions";

export function CrmSendEmailForm({
  dealId,
  defaultTo,
  replyToLabel,
}: {
  dealId: string;
  defaultTo: string;
  replyToLabel: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    const result = await sendCrmEmail({
      dealId,
      to: String(data.get("to") ?? ""),
      subject: String(data.get("subject") ?? ""),
      body: String(data.get("body") ?? ""),
    });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not send email", description: result.error });
      return;
    }
    form.reset();
    toast({ title: "Email sent", description: `Replies go to ${replyToLabel}` });
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Sent via HSEQ Nova. Replies go to <span className="font-medium text-foreground">{replyToLabel}</span>.
      </p>
      <div className="space-y-1">
        <Label htmlFor="to">To</Label>
        <Input id="to" name="to" type="email" required defaultValue={defaultTo} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required maxLength={200} placeholder="Following up on HSEQ Nova" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" required minLength={10} rows={6} placeholder="Write the email…" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send email"}
      </Button>
    </form>
  );
}
