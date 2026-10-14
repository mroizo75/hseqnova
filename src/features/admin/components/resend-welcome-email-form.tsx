"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { resendWelcomeEmail } from "@/server/actions/admin-registration.actions";
import { Loader2, Mail } from "lucide-react";

interface ResendWelcomeEmailFormProps {
  tenantId: string;
  userEmail: string;
  userName: string;
}

export function ResendWelcomeEmailForm({
  tenantId,
  userEmail,
}: ResendWelcomeEmailFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    const result = await resendWelcomeEmail({
      tenantId,
      userEmail,
    });
    setLoading(false);

    if (result.success) {
      toast({
        title: "Login email sent",
        description: `A generated password has been sent to ${userEmail}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Could not send",
        description: result.error || "Could not send the email",
      });
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleResend} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Mail className="h-4 w-4 mr-2" />
          Generate password and send
        </>
      )}
    </Button>
  );
}
