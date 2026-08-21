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
  ACCEPTED: "Avtale godkjent",
  SENT: "Sendt",
  REJECTED: "Avvist",
  EXPIRED: "Utløpt",
  DRAFT: "Utkast",
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
        title: "Ugyldig beløp",
        description: "Etableringspris må være et heltall i kroner.",
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
        title: "Tilbud sendt",
        description: "Kunden har fått e-post med lenke til kontrakt.",
      });
      setNotes("");
      setSetupPrice("");
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Kunne ikke sende tilbud",
        description: result.error || "Noe gikk galt. Prøv igjen.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tilbud / Kontrakt
        </CardTitle>
        <CardDescription>
          Send standardtilbud med 12 mnd binding og 3 mnd oppsigelse direkte til kunden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Mottaker</Label>
              <p className="text-sm font-medium mt-1">
                {tenant.invoiceEmail || tenant.contactEmail || "Ingen e-post registrert"}
              </p>
              <p className="text-xs text-muted-foreground">
                Tilbud sendes til faktura-epost, eller kontaktperson hvis den mangler.
              </p>
            </div>
            <div>
              <Label htmlFor="setupPrice">Etablering / oppsett (kr)</Label>
              <Input
                id="setupPrice"
                type="number"
                min={0}
                value={setupPrice}
                onChange={(e) => setSetupPrice(e.target.value)}
                placeholder="Valgfritt, f.eks. 3000"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="offerNotes">Tilleggsnotat til tilbud (valgfritt)</Label>
            <textarea
              id="offerNotes"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="F.eks. spesielle avtaler, rabatter eller hva som er inkludert i oppsettet."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!tenant.invoiceEmail && !tenant.contactEmail)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sender...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send tilbud
                </>
              )}
            </Button>
          </div>
        </form>

        {latestOffer && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Siste tilbud
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
              Årspris:{" "}
              <span className="font-semibold">
                {latestOffer.yearlyPrice.toLocaleString("nb-NO")} kr/år
              </span>{" "}
              • Binding: {latestOffer.bindingMonths} mnd • Oppsigelse:{" "}
              {latestOffer.noticeMonths} mnd
            </p>
            {latestOffer.sentAt && (
              <p className="text-xs text-muted-foreground">
                Sendt:{" "}
                {new Date(latestOffer.sentAt).toLocaleDateString("nb-NO", {
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
                Akseptert:{" "}
                {new Date(latestOffer.acceptedAt).toLocaleDateString("nb-NO", {
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

