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
        title: "Admin email updated",
        description: `New email: ${newEmail}`,
      });
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } else {
      toast({
        variant: "destructive",
        title: "Could not update",
        description: result.error || "Something went wrong",
      });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="currentEmail">Current email</Label>
        <Input
          id="currentEmail"
          value={currentEmail}
          disabled
          className="bg-muted"
        />
      </div>

      <div>
        <Label htmlFor="newEmail">New email *</Label>
        <Input
          id="newEmail"
          name="newEmail"
          type="email"
          placeholder="admin@example.com"
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update email
      </Button>
    </form>
  );
}

