"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Mail, Clock } from "lucide-react";
import { openStripeBillingPortal } from "@/server/actions/settings.actions";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function SuspendedPage() {
  const [loading, setLoading] = useState(false);

  const handleReactivate = async () => {
    setLoading(true);
    const result = await openStripeBillingPortal();
    if (result.success && result.url) {
      window.location.href = result.url;
      return;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <Image src="/logo-black.png" alt="HSEQ Nova" width={160} height={48} />
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Subscription paused</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
            <p className="font-semibold">Your subscription is no longer active.</p>
            <p>
              This can happen if a payment failed or the subscription was cancelled.
              Your data is safe for now, but will be permanently deleted after 90 days
              if the subscription is not reactivated.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Grace period</p>
              <p className="text-sm text-muted-foreground">
                You have 90 days from suspension to reactivate. After that, all company
                data (documents, incidents, training records) will be permanently deleted
                in accordance with UK GDPR.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Need help?</p>
              <p className="text-sm text-muted-foreground">
                Contact us at{" "}
                <a href="mailto:hello@hseqnova.co.uk" className="underline font-medium">
                  hello@hseqnova.co.uk
                </a>{" "}
                if you need to export your data or have questions about your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleReactivate} disabled={loading} size="lg" className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              {loading ? "Opening Stripe…" : "Reactivate subscription"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-transparent"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
