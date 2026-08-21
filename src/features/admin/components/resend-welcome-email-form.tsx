"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { resendWelcomeEmail } from "@/server/actions/onboarding.actions";
import { Loader2, Mail } from "lucide-react";

interface ResendWelcomeEmailFormProps {
  tenantId: string;
  userEmail: string;
  userName: string;
}

export function ResendWelcomeEmailForm({
  tenantId,
  userEmail,
  userName,
}: ResendWelcomeEmailFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!confirm(`Send nytt passord til ${userEmail}?`)) {
      return;
    }

    setLoading(true);

    try {
      console.log("📧 Resending welcome email to:", userEmail);
      const result = await resendWelcomeEmail({
        tenantId,
        userEmail,
      });
      console.log("📧 Result:", result);

      if (result.success) {
        alert("✅ E-post sendt til " + userEmail + "!");
        toast({
          title: "✅ E-post sendt!",
          description: `Nytt passord er sendt til ${userEmail}`,
        });
      } else {
        alert("❌ Feil: " + (result.error || "Kunne ikke sende e-post"));
        toast({
          variant: "destructive",
          title: "❌ Feil",
          description: result.error || "Kunne ikke sende e-post",
        });
      }
    } catch (error) {
      console.error("Resend email error:", error);
      alert("❌ Systemfeil ved sending av e-post");
      toast({
        variant: "destructive",
        title: "❌ Systemfeil",
        description: "En uventet feil oppstod",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResend}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Mail className="h-4 w-4 mr-2" />
          Send nytt passord
        </>
      )}
    </Button>
  );
}

