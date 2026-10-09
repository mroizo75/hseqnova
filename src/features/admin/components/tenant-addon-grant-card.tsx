"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADDON_PACKS, type AddonPackId } from "@/lib/billing-catalog";
import { grantTenantAddonPack, revokeTenantAddonPack } from "@/server/actions/admin-billing.actions";
import { useToast } from "@/hooks/use-toast";
import type { TenantPackEntitlement } from "@/server/queries/billing.queries";
import { Loader2, Package } from "lucide-react";

const TRIAL_OPTIONS = [
  { value: "0", label: "Charge now (no trial)" },
  { value: "1", label: "1 month free, then paid" },
  { value: "2", label: "2 months free, then paid" },
  { value: "3", label: "3 months free, then paid" },
  { value: "6", label: "6 months free, then paid" },
  { value: "12", label: "12 months free, then paid" },
] as const;

type TenantAddonGrantCardProps = {
  tenantId: string;
  hasStripeSubscription: boolean;
  entitlements: TenantPackEntitlement[];
};

function statusBadge(status: TenantPackEntitlement["status"]) {
  if (status === "TRIAL") {
    return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Trial</Badge>;
  }
  if (status === "PENDING_CANCEL") {
    return <Badge variant="secondary">Ends at period end</Badge>;
  }
  if (status === "ACTIVE") {
    return <Badge className="border-green-200 bg-green-100 text-green-800">Active</Badge>;
  }
  return <Badge variant="outline">Off</Badge>;
}

function formatMoneyGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export function TenantAddonGrantCard({
  tenantId,
  hasStripeSubscription,
  entitlements,
}: TenantAddonGrantCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [packId, setPackId] = useState(ADDON_PACKS[0]?.id ?? "rams");
  const [trialMonths, setTrialMonths] = useState("3");
  const [granting, setGranting] = useState(false);
  const [revokingPackId, setRevokingPackId] = useState<string | null>(null);

  async function onGrant() {
    setGranting(true);
    const result = await grantTenantAddonPack({
      tenantId,
      packId,
      trialMonths: Number(trialMonths),
    });
    setGranting(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not grant pack", description: result.error });
      return;
    }
    toast({
      title: "Pack granted",
      description: result.trialEndsAt
        ? `Trial ends ${new Date(result.trialEndsAt).toLocaleDateString("en-GB")}. Stripe will charge automatically after that.`
        : "The pack is on the Stripe subscription and will be billed from now.",
    });
    router.refresh();
  }

  async function onRevoke(id: string) {
    setRevokingPackId(id);
    const result = await revokeTenantAddonPack({ tenantId, packId: id });
    setRevokingPackId(null);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not remove pack", description: result.error });
      return;
    }
    toast({
      title: "Pack updated",
      description: `Access ends ${new Date(result.endsAt).toLocaleDateString("en-GB")}.`,
    });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Add-on packs
        </CardTitle>
        <CardDescription>
          Grant RAMS, COSHH, CDM and other packs. A trial uses the card or Direct Debit on file;
          Stripe starts charging when the trial ends.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasStripeSubscription && (
          <p className="text-sm text-amber-800">
            This company has no Stripe subscription yet. They must complete checkout before a trial
            can convert to paid billing.
          </p>
        )}

        <div className="space-y-3">
          {entitlements.map((row) => (
            <div key={row.packId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMoneyGbp(row.monthlyPriceGbp)}/month
                  {row.status === "TRIAL" && row.endsAt
                    ? ` · trial until ${new Date(row.endsAt).toLocaleDateString("en-GB")}`
                    : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(row.status)}
                {row.status !== "off" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                    disabled={revokingPackId === row.packId}
                    onClick={() => onRevoke(row.packId)}
                  >
                    {revokingPackId === row.packId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Pack</Label>
            <Select value={packId} onValueChange={(value) => setPackId(value as AddonPackId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADDON_PACKS.map((pack) => (
                  <SelectItem key={pack.id} value={pack.id}>
                    {pack.name} · {formatMoneyGbp(pack.monthlyPriceGbp)}/month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trial</Label>
            <Select value={trialMonths} onValueChange={setTrialMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="button" onClick={onGrant} disabled={granting || !hasStripeSubscription}>
          {granting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Grant pack
        </Button>
      </CardContent>
    </Card>
  );
}
