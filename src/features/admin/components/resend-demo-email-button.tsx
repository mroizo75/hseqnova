"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resendDemoWorkspaceEmail } from "@/server/actions/admin-demo.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export function ResendDemoEmailButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const result = await resendDemoWorkspaceEmail(tenantId);
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not send email", description: result.error });
      return;
    }
    toast({
      title: "Login email sent",
      description: `Sent to ${result.email}. Resend id ${result.resendId}.`,
    });
    router.refresh();
  }

  return (
    <Button type="button" onClick={onClick} disabled={loading} className="w-full">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      Send login email
    </Button>
  );
}
