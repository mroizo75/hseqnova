"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTenantAdminEmail } from "@/server/actions/tenant.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface UpdateAdminEmailFormProps {
  tenantId: string;
  currentEmail: string;
}

export function UpdateAdminEmailForm({ tenantId, currentEmail }: UpdateAdminEmailFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const newEmail = formData.get("newEmail") as string;

    const result = await updateTenantAdminEmail({
      tenantId,
      oldEmail: currentEmail,
      newEmail,
    });

    if (result.success) {
      toast({
        title: "✅ Admin-e-post oppdatert",
        description: `Ny e-post: ${newEmail}`,
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
        <Label htmlFor="currentEmail">Nåværende e-post</Label>
        <Input
          id="currentEmail"
          value={currentEmail}
          disabled
          className="bg-muted"
        />
      </div>

      <div>
        <Label htmlFor="newEmail">Ny e-postadresse *</Label>
        <Input
          id="newEmail"
          name="newEmail"
          type="email"
          placeholder="ny-admin@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Oppdater e-post
      </Button>
    </form>
  );
}

