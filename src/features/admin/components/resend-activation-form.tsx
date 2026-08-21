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
        title: "✅ Aktiverings-e-post sendt",
        description: "Brukeren vil motta påloggingsinformasjon",
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      toast({
        variant: "destructive",
        title: "❌ Feil",
        description: result.error || "Noe gikk galt",
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="adminEmail">Admin e-post *</Label>
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
        <Label htmlFor="adminPassword">Nytt passord *</Label>
        <Input
          id="adminPassword"
          name="adminPassword"
          type="password"
          placeholder="Minst 8 tegn"
          minLength={8}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Dette passordet vil bli sendt til brukeren
        </p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send aktivering
      </Button>
    </form>
  );
}

