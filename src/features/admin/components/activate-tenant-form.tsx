"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { activateTenant } from "@/server/actions/admin-registration.actions";
import { Loader2, CheckCircle2 } from "lucide-react";

interface ActivateTenantFormProps {
  tenantId: string;
  defaultEmail: string;
  defaultName: string;
}

export function ActivateTenantForm({
  tenantId,
  defaultEmail,
  defaultName,
}: ActivateTenantFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adminEmail: defaultEmail,
    adminName: defaultName,
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await activateTenant({
        tenantId,
        ...formData,
      });

      if (result.success) {
        toast({
          title: "Organisation activated",
          description: `Login details sent to ${result.email}.`,
        });
        router.push("/admin/registrations");
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not activate",
          description: result.error || "Could not activate the organisation",
        });
        if ("tenantId" in result && result.tenantId) {
          router.push(`/admin/tenants/${result.tenantId}`);
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Could not activate",
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="adminEmail">Admin email *</Label>
        <Input
          id="adminEmail"
          type="email"
          value={formData.adminEmail}
          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
          required
          placeholder="admin@example.com"
        />
        <p className="text-xs text-muted-foreground">
          Sign-in email for the organisation administrator
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminName">Admin name *</Label>
        <Input
          id="adminName"
          type="text"
          value={formData.adminName}
          onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
          required
          placeholder="Jane Smith"
        />
      </div>

      <p className="text-sm text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
        A temporary password is generated automatically and emailed to the admin. You do not invent one.
      </p>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g. special terms or discounts"
          rows={3}
        />
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating…
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Activate and send login email
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
