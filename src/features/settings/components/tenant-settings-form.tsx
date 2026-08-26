"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTenantSettings } from "@/server/actions/settings.actions";
import { useToast } from "@/hooks/use-toast";
import { Building2, ShieldAlert } from "lucide-react";
import type { Tenant } from "@prisma/client";

interface TenantSettingsFormProps {
  tenant: Tenant;
  isAdmin: boolean;
}

export function TenantSettingsForm({ tenant, isAdmin }: TenantSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "No access",
        description: "Only administrators can change company settings",
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      companyNumber: (formData.get("companyNumber") as string) || undefined,
      vatNumber: (formData.get("vatNumber") as string) || undefined,
      contactEmail: (formData.get("contactEmail") as string) || undefined,
      contactPhone: (formData.get("contactPhone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      postalCode: (formData.get("postalCode") as string) || undefined,
      hmsContactName: (formData.get("hmsContactName") as string) || undefined,
      hmsContactPhone: (formData.get("hmsContactPhone") as string) || undefined,
      hmsContactEmail: (formData.get("hmsContactEmail") as string) || undefined,
    };

    const result = await updateTenantSettings(data);

    if (result.success) {
      toast({
        title: "Settings saved",
        description: "Company details have been updated",
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not save settings",
      });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company details
          </CardTitle>
          <CardDescription>
            Legal identity for this organisation. Used on the health and safety policy and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company name *</Label>
            <Input
              id="name"
              name="name"
              required
              disabled={loading || !isAdmin}
              defaultValue={tenant.name}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyNumber">Companies House number</Label>
              <Input
                id="companyNumber"
                name="companyNumber"
                placeholder="12345678"
                disabled={loading || !isAdmin}
                defaultValue={tenant.companyNumber || tenant.orgNumber || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT number</Label>
              <Input
                id="vatNumber"
                name="vatNumber"
                placeholder="GB123456789"
                disabled={loading || !isAdmin}
                defaultValue={tenant.vatNumber || ""}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="hello@company.co.uk"
                disabled={loading || !isAdmin}
                defaultValue={tenant.contactEmail || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact telephone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                placeholder="020 7946 0000"
                disabled={loading || !isAdmin}
                defaultValue={tenant.contactPhone || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="1 Example Street"
              disabled={loading || !isAdmin}
              defaultValue={tenant.address || ""}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postcode</Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="SW1A 1AA"
                disabled={loading || !isAdmin}
                defaultValue={tenant.postalCode || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Town / city</Label>
              <Input
                id="city"
                name="city"
                placeholder="London"
                disabled={loading || !isAdmin}
                defaultValue={tenant.city || ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
            Competent person
          </CardTitle>
          <CardDescription>
            MHSWR 1999 reg.7: the person appointed to assist with health and safety. Shown to
            employees as the HSE contact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hmsContactName">Name</Label>
            <Input
              id="hmsContactName"
              name="hmsContactName"
              placeholder="Jane Smith"
              disabled={loading || !isAdmin}
              defaultValue={tenant.hmsContactName || ""}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hmsContactPhone">Telephone</Label>
              <Input
                id="hmsContactPhone"
                name="hmsContactPhone"
                type="tel"
                placeholder="020 7946 0000"
                disabled={loading || !isAdmin}
                defaultValue={tenant.hmsContactPhone || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hmsContactEmail">Email</Label>
              <Input
                id="hmsContactEmail"
                name="hmsContactEmail"
                type="email"
                placeholder="hse@company.co.uk"
                disabled={loading || !isAdmin}
                defaultValue={tenant.hmsContactEmail || ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {isAdmin && (
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              Only administrators can change company settings
            </p>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
