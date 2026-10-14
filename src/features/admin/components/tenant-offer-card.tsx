"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createTenantOffer } from "@/server/actions/tenant.actions";
import { Loader2, FileText, CheckCircle2, Send } from "lucide-react";

type TenantOfferStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

const OFFER_STATUS_LABELS: Record<TenantOfferStatus, string> = {
  ACCEPTED: "Accepted",
  SENT: "Sent",
  REJECTED: "Declined",
  EXPIRED: "Expired",
  DRAFT: "Draft",
};

interface TenantOfferCardProps {
  tenant: {
    id: string;
    name: string;
    orgNumber: string | null;
    contactPerson: string | null;
    contactEmail: string | null;
    invoiceEmail: string | null;
    offers?: {
      id: string;
      status: TenantOfferStatus;
      yearlyPrice: number;
      setupPrice: number | null;
      bindingMonths: number;
      noticeMonths: number;
      createdAt: string | Date;
      sentAt: string | Date | null;
      acceptedAt: string | Date | null;
    }[];
  };
}

export function TenantOfferCard({ tenant }: TenantOfferCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [setupPrice, setSetupPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latestOffer = tenant.offers && tenant.offers.length > 0 ? tenant.offers[0] : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsedSetup = setupPrice.trim()
      ? parseInt(setupPrice.trim(), 10)
      : undefined;

    if (Number.isNaN(parsedSetup as number)) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Setup fee must be a whole number in GBP.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await createTenantOffer({
      tenantId: tenant.id,
      setupPrice: parsedSetup,
      notes: notes.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Proposal sent",
        description: "The customer has been emailed a link to the contract.",
      });
      setNotes("");
      setSetupPrice("");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not send proposal",
        description: result.error || "Something went wrong. Try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Proposal / contract
        </CardTitle>
        <CardDescription>
          Send a standard proposal with a 12-month term and 3 months’ notice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Recipient</Label>
              <p className="text-sm font-medium mt-1">
                {tenant.invoiceEmail || tenant.contactEmail || "No email on file"}
              </p>
              <p className="text-xs text-muted-foreground">
                Sent to the invoice email, or the contact if none is set.
              </p>
            </div>
            <div>
              <Label htmlFor="setupPrice">Setup fee (£)</Label>
              <Input
                id="setupPrice"
                type="number"
                min={0}
                value={setupPrice}
                onChange={(e) => setSetupPrice(e.target.value)}
                placeholder="Optional, e.g. 300"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="offerNotes">Note on the proposal (optional)</Label>
            <textarea
              id="offerNotes"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. special terms, discounts, or what the setup includes."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!tenant.invoiceEmail && !tenant.contactEmail)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send proposal
                </>
              )}
            </Button>
          </div>
        </form>

        {latestOffer && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Latest proposal
              </span>
              <Badge
                variant={
                  latestOffer.status === "ACCEPTED"
                    ? "default"
                    : latestOffer.status === "SENT"
                    ? "secondary"
                    : "outline"
                }
                className="flex items-center gap-1 text-xs"
              >
                {latestOffer.status === "ACCEPTED" && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {OFFER_STATUS_LABELS[latestOffer.status]}
              </Badge>
            </div>
            <p className="text-sm">
              Annual price:{" "}
              <span className="font-semibold">
                £{latestOffer.yearlyPrice.toLocaleString("en-GB")}/year
              </span>{" "}
              • Term: {latestOffer.bindingMonths} months • Notice:{" "}
              {latestOffer.noticeMonths} months
            </p>
            {latestOffer.sentAt && (
              <p className="text-xs text-muted-foreground">
                Sent:{" "}
                {new Date(latestOffer.sentAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {latestOffer.acceptedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Accepted:{" "}
                {new Date(latestOffer.acceptedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

