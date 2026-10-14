"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendActivationEmail } from "@/server/actions/tenant.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ResendActivationFormProps {
  tenantId: string;
  defaultEmail: string;
}

export function ResendActivationForm({ tenantId, defaultEmail }: ResendActivationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      tenantId,
      adminEmail: formData.get("adminEmail") as string,
      adminPassword: formData.get("adminPassword") as string,
    };

    const result = await resendActivationEmail(data);

    if (result.success) {
      toast({
        title: "Activation email sent",
        description: "They will receive sign-in details",
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
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
        <Label htmlFor="adminEmail">Admin email *</Label>
        <Input
          id="adminEmail"
          name="adminEmail"
          type="email"
          defaultValue={defaultEmail}
          placeholder="admin@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="adminPassword">New password *</Label>
        <Input
          id="adminPassword"
          name="adminPassword"
          type="password"
          placeholder="At least 8 characters"
          minLength={8}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          This password is sent in the email
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send activation
      </Button>
    </form>
  );
}

