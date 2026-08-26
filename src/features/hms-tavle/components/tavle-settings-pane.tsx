"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ActivateTavleAddonButton } from "./activate-addon-button";

interface TavleSettingsPaneProps {
  subscription: {
    plan: string;
    status: string;
    pricePerMonth: number;
    isAddon: boolean;
    endsAt: string;
    maxTavler: number;
  } | null;
  tavleCount: number;
  isAdmin: boolean;
}

function formatMoneyGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

export function TavleSettingsPane({
  subscription,
  tavleCount,
  isAdmin,
}: TavleSettingsPaneProps) {
  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Only administrators can manage the digital safety board add-on.
        </CardContent>
      </Card>
    );
  }

  if (subscription) {
    const isActive =
      subscription.status !== "EXPIRED" && subscription.status !== "CANCELLED";

    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      TRIAL: { label: "Trial", variant: "secondary" },
      ACTIVE: { label: "Active", variant: "default" },
      EXPIRING_SOON: { label: "Expiring soon", variant: "outline" },
      EXPIRED: { label: "Expired", variant: "destructive" },
      CANCELLED: { label: "Cancelled", variant: "destructive" },
    };

    const statusInfo = statusMap[subscription.status] ?? {
      label: subscription.status,
      variant: "secondary" as const,
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-4 w-4 text-blue-600" />
              Digital safety board
            </CardTitle>
            <CardDescription>
              Site information display for CDM 2015 and workplace communication. Not a substitute
              for the written health and safety policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-semibold">
                  {subscription.plan === "ADDON" ? "HSEQ Nova add-on" : subscription.plan}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-semibold">
                  {formatMoneyGbp(subscription.pricePerMonth)}
                  <span className="text-sm font-normal text-muted-foreground">/month ex VAT</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Boards</p>
                <p className="font-semibold">
                  {tavleCount} of {subscription.maxTavler >= 999 ? "unlimited" : subscription.maxTavler}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? `Current term to ${new Date(subscription.endsAt).toLocaleDateString("en-GB")}`
                  : "This add-on is not active"}
              </p>
              <Button variant="outline" size="sm" className="bg-transparent" asChild>
                <Link href="/dashboard/hms-tavle">
                  <Monitor className="mr-1.5 h-3.5 w-3.5" />
                  Open safety boards
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-5 w-5 text-blue-600" />
            Digital safety board
          </CardTitle>
          <CardDescription>
            Optional add-on: a live board for site induction, QR access and kiosk display (CDM 2015
            site information).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use on construction sites, hotels or any workplace that needs a public safety notice
            board. Core HSEQ (policy, accident book, inspections) stays in the main subscription.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "QR check-in for people on site",
              "Contractor portal for incidents and RAMS",
              "Kiosk mode for a large screen",
              "Live figures from HSEQ Nova",
              "Fire and first-aid information",
              "Site rules and induction notes",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                {feature}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold">
                From £30
                <span className="text-sm font-normal text-muted-foreground">/month ex VAT</span>
              </p>
              <p className="text-xs text-muted-foreground">Added to the existing HSEQ Nova invoice</p>
            </div>
            <div className="flex gap-2">
              <ActivateTavleAddonButton />
              <Button variant="outline" className="bg-transparent" asChild>
                <Link href="/dashboard/hms-tavle">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Open boards
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
