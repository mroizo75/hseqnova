"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createCrmCompany } from "@/server/actions/crm.actions";

export function CrmCreateCompanyForm({
  canAssignOwner,
  salespeople,
}: {
  canAssignOwner: boolean;
  salespeople: Array<{ id: string; name: string | null; email: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const result = await createCrmCompany({
      name: String(form.get("name") ?? ""),
      companyNumber: String(form.get("companyNumber") ?? "") || undefined,
      industry: String(form.get("industry") ?? "") || undefined,
      website: String(form.get("website") ?? "") || undefined,
      address: String(form.get("address") ?? "") || undefined,
      city: String(form.get("city") ?? "") || undefined,
      postalCode: String(form.get("postalCode") ?? "") || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
      contactName: String(form.get("contactName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? "") || undefined,
      contactPhone: String(form.get("contactPhone") ?? "") || undefined,
      valueGbp: form.get("valueGbp") ? Number(form.get("valueGbp")) : undefined,
      ownerId: String(form.get("ownerId") ?? "") || undefined,
    });
    setLoading(false);
    if (!result.success || !result.data) {
      toast({ variant: "destructive", title: "Could not create company", description: result.error });
      return;
    }
    toast({ title: "Company added", description: "The deal is now in New lead." });
    router.push(`/admin/crm/deals/${result.data.dealId}`);
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="name">Company name *</Label>
        <Input id="name" name="name" required placeholder="Acme Ltd" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyNumber">Companies House number</Label>
        <Input id="companyNumber" name="companyNumber" placeholder="12345678" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input id="industry" name="industry" placeholder="Construction" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactName">Primary contact *</Label>
        <Input id="contactName" name="contactName" required placeholder="Jane Smith" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">Email</Label>
        <Input id="contactEmail" name="contactEmail" type="email" placeholder="jane@acme.co.uk" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPhone">Phone</Label>
        <Input id="contactPhone" name="contactPhone" placeholder="+44 7700 900000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="valueGbp">Pipeline value (GBP)</Label>
        <Input id="valueGbp" name="valueGbp" type="number" min="0" step="1" defaultValue="0" />
      </div>
      {canAssignOwner && (
        <div className="space-y-2">
          <Label htmlFor="ownerId">Owner</Label>
          <select
            id="ownerId"
            name="ownerId"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Assign later</option>
            {salespeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name || person.email}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Add to pipeline"}
        </Button>
      </div>
    </form>
  );
}
