"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendActivationEmail } from "@/server/actions/tenant.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

interface ResendActivationFormProps {
  tenantId: string;
  defaultEmail: string;
}

export function ResendActivationForm({ tenantId, defaultEmail }: ResendActivationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState(defaultEmail);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const result = await resendActivationEmail({
      tenantId,
      adminEmail: adminEmail.trim() || undefined,
    });

    if (result.success) {
      toast({
        title: "Login email sent",
        description: `A generated password has been sent to ${result.email}`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not send",
        description: result.error || "Something went wrong",
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="adminEmail">Admin email</Label>
        <Input
          id="adminEmail"
          name="adminEmail"
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          A new temporary password is generated and emailed. You do not choose it.
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        Generate password and send
      </Button>
    </form>
  );
}
