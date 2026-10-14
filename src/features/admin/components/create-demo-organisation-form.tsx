"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADDON_PACKS, HSEQ_CORE, type AddonPackId } from "@/lib/billing-catalog";
import { SUPPORTED_INDUSTRIES } from "@/lib/industry-packages";
import { DEMO_DURATION_DAYS } from "@/lib/demo-access";
import { createDemoOrganisation } from "@/server/actions/admin-demo.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export function CreateDemoOrganisationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [industry, setIndustry] = useState("other");
  const [demoDays, setDemoDays] = useState("7");
  const [addonIds, setAddonIds] = useState<AddonPackId[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleAddon(id: AddonPackId, checked: boolean) {
    setAddonIds((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await createDemoOrganisation({
      name,
      companyNumber: companyNumber || undefined,
      contactPerson,
      contactEmail,
      contactPhone: contactPhone || undefined,
      industry,
      demoDays: Number(demoDays),
      addonIds,
    });
    setLoading(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not create demo", description: result.error });
      return;
    }
    toast({
      title: "Demo workspace created",
      description: `Login details have been emailed. Access ends ${new Date(result.trialEndsAt).toLocaleDateString("en-GB")}.`,
    });
    router.push(`/admin/tenants/${result.tenantId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>
            Creates a time-limited workspace. The client signs in and tries the product. They subscribe and pay
            in Stripe if they want to keep it.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Organisation name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyNumber">Companies House number (optional)</Label>
            <Input
              id="companyNumber"
              value={companyNumber}
              onChange={(e) => setCompanyNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_INDUSTRIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact name</Label>
            <Input
              id="contactPerson"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Work email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone (optional)</Label>
            <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Demo length</Label>
            <Select value={demoDays} onValueChange={setDemoDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEMO_DURATION_DAYS.map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {days} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Packs in this demo</CardTitle>
          <CardDescription>
            Core is always included ({formatGbp(HSEQ_CORE.monthlyPriceGbp)}/month when they subscribe). Tick add-ons
            they should try. They can change the paid mix at subscribe time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="font-medium">{HSEQ_CORE.name}</p>
            <p className="text-sm text-muted-foreground">{HSEQ_CORE.description}</p>
          </div>
          {ADDON_PACKS.map((pack) => (
            <label key={pack.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={addonIds.includes(pack.id)}
                onCheckedChange={(checked) => toggleAddon(pack.id, checked === true)}
              />
              <span>
                <span className="font-medium">{pack.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {pack.description} · {formatGbp(pack.monthlyPriceGbp)}/month after the demo
                </span>
              </span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create demo and email login
      </Button>
    </form>
  );
}
