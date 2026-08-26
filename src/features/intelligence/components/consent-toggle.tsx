"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Shield, TrendingUp } from "lucide-react";
import { updateIntelligenceConsent } from "@/server/actions/intelligence-consent.actions";
import { useToast } from "@/hooks/use-toast";

interface ConsentToggleProps {
  initialOptedIn: boolean;
  isAdmin: boolean;
}

export function IntelligenceConsentToggle({ initialOptedIn, isAdmin }: ConsentToggleProps) {
  const { toast } = useToast();
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    if (!isAdmin) return;

    setOptedIn(checked);
    startTransition(async () => {
      const result = await updateIntelligenceConsent(checked);
      if (!result.success) {
        setOptedIn(!checked);
        toast({
          variant: "destructive",
          title: "Could not save",
          description: result.error || "Could not update benchmarking consent",
        });
        return;
      }
      toast({
        title: checked ? "Benchmarking is on" : "Benchmarking is off",
        description: checked
          ? "Anonymised industry figures can include this company"
          : "This company is excluded from industry aggregates",
        className: "bg-green-50 border-green-200",
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Industry benchmarking
            </CardTitle>
            <CardDescription className="mt-1">
              Opt in to anonymised UK industry statistics (TRIR, response times, inspection
              completion). UK GDPR / DPA 2018: no company name or personal data is shared with other
              customers.
            </CardDescription>
          </div>
          {optedIn && (
            <Badge variant="secondary" className="shrink-0">
              On
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium">Anonymised</p>
              <p className="text-xs text-muted-foreground">
                Aggregates only. A group is shown only when at least five companies share the same
                industry bucket (k-anonymity).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Compare</p>
              <p className="text-xs text-muted-foreground">
                See your accident-book rate, overdue actions and inspection completion against the
                UK peer average.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Early warning</p>
              <p className="text-xs text-muted-foreground">
                Optional alerts when your figures move against the industry trend.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="intelligence-consent" className="text-base font-medium">
              Include this company in industry statistics
            </Label>
            <p className="text-sm text-muted-foreground">
              On by default. You can turn it off at any time. Turning it off does not delete your
              own records; it only stops them entering the anonymised pool.
            </p>
          </div>
          <Switch
            id="intelligence-consent"
            checked={optedIn}
            onCheckedChange={handleToggle}
            disabled={!isAdmin || isPending}
          />
        </div>

        {!isAdmin && (
          <p className="text-sm italic text-muted-foreground">
            Only an administrator can change this.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
