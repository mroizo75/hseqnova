"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  cancelTrainingBooking,
  saveTrainingBooking,
  sendTrainingBookingInvoice,
} from "@/server/actions/training-sales.actions";
import type { TrainingEngagementRecord } from "@/server/queries/training-sales.queries";

export function TrainingInvoiceForm({
  engagement,
  followUpMonths,
  defaultDueDate,
}: {
  engagement: TrainingEngagementRecord;
  followUpMonths: number;
  defaultDueDate: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const locked = engagement.status === "CANCELLED";
  const invoiced = Boolean(engagement.stripeInvoiceId);

  const read = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const courseDate = String(data.get("courseDate") ?? "") || engagement.courseDate || "";
    const validity = data.get("validityMonths");
    const delegates = data.get("delegateCount");
    const price = data.get("unitPriceGbp");
    return {
      id: engagement.id,
      courseDate,
      validityMonths: validity ? Number(validity) : engagement.validityMonths,
      delegateCount: delegates ? Number(delegates) : engagement.delegateCount,
      unitPriceGbp: price ? Number(price) : (engagement.unitPriceGbp ?? 0),
    };
  };

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveTrainingBooking(read(event.currentTarget));
    setSaving(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not save", description: result.error });
      return;
    }
    toast({
      title: "Follow-up scheduled",
      description: `The CRM task is ${followUpMonths} months before the competence record expires.`,
    });
    router.refresh();
  };

  const onInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    const data = new FormData(event.currentTarget);
    const result = await sendTrainingBookingInvoice({
      ...read(event.currentTarget),
      dueDate: String(data.get("dueDate") ?? ""),
      invoiceEmail: String(data.get("invoiceEmail") ?? ""),
      addressLine1: String(data.get("addressLine1") ?? ""),
      city: String(data.get("city") ?? ""),
      postcode: String(data.get("postcode") ?? ""),
      vatNumber: String(data.get("vatNumber") ?? ""),
      purchaseOrderNumber: String(data.get("purchaseOrderNumber") ?? ""),
      note: String(data.get("note") ?? ""),
    });
    setSending(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Invoice was not sent", description: result.error });
      return;
    }
    toast({ title: "Invoice sent", description: "The customer has the Stripe invoice, and the renewal task is in the CRM." });
    router.refresh();
  };

  const onCancel = async () => {
    setCancelling(true);
    const result = await cancelTrainingBooking(engagement.id);
    setCancelling(false);
    if (!result.success) {
      toast({ variant: "destructive", title: "Could not cancel", description: result.error });
      return;
    }
    toast({ title: "Booking cancelled", description: "The renewal task is closed." });
    router.refresh();
  };

  return (
    <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="courseDate">Course date</Label>
        <Input id="courseDate" name="courseDate" type="date" required defaultValue={engagement.courseDate ?? ""} disabled={locked} />
        <p className="text-xs text-muted-foreground">The competence period starts on this date.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="validityMonths">Competence period (months)</Label>
        <Input
          id="validityMonths"
          name="validityMonths"
          type="number"
          min={followUpMonths + 1}
          max={60}
          required
          defaultValue={engagement.validityMonths}
          disabled={locked}
        />
        <p className="text-xs text-muted-foreground">
          A review date, not a statutory expiry. Contact is {followUpMonths} months before it ends.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="delegateCount">People</Label>
        <Input id="delegateCount" name="delegateCount" type="number" min={1} max={500} required defaultValue={engagement.delegateCount} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unitPriceGbp">Price per person (GBP, ex VAT)</Label>
        <Input
          id="unitPriceGbp"
          name="unitPriceGbp"
          type="number"
          min={1}
          step="0.01"
          required
          defaultValue={engagement.unitPriceGbp ?? ""}
          disabled={locked || invoiced}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoiceEmail">Invoice email</Label>
        <Input id="invoiceEmail" name="invoiceEmail" type="email" required defaultValue={engagement.invoiceEmail ?? engagement.contactEmail} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Invoice due date</Label>
        <Input id="dueDate" name="dueDate" type="date" required defaultValue={defaultDueDate} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="addressLine1">Invoice address</Label>
        <Input id="addressLine1" name="addressLine1" required defaultValue={engagement.invoiceAddress ?? ""} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" required defaultValue={engagement.invoiceCity ?? ""} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postcode">Postcode</Label>
        <Input id="postcode" name="postcode" required defaultValue={engagement.invoicePostcode ?? ""} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vatNumber">VAT number</Label>
        <Input id="vatNumber" name="vatNumber" placeholder="GB123456789" defaultValue={engagement.vatNumber ?? ""} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchaseOrderNumber">Purchase order</Label>
        <Input id="purchaseOrderNumber" name="purchaseOrderNumber" defaultValue={engagement.purchaseOrderNumber ?? ""} disabled={locked || invoiced} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="note">Note on the invoice</Label>
        <Textarea id="note" name="note" rows={2} disabled={locked || invoiced} placeholder="Delivered at the customer’s yard." />
      </div>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button type="submit" variant="outline" className="bg-transparent" disabled={locked || saving || sending}>
          {saving ? "Saving…" : "Save date and follow-up"}
        </Button>
        {!invoiced && (
          <Button
            type="button"
            disabled={locked || saving || sending}
            onClick={(event) => {
              const form = event.currentTarget.closest("form");
              if (!form) return;
              void onInvoice({ preventDefault() {}, currentTarget: form } as React.FormEvent<HTMLFormElement>);
            }}
          >
            {sending ? "Sending invoice…" : "Send Stripe invoice"}
          </Button>
        )}
      </div>
      {!locked && (
        <div className="md:col-span-2 border-t pt-4">
          <Button type="button" variant="outline" className="bg-transparent" disabled={cancelling} onClick={onCancel}>
            {cancelling ? "Cancelling…" : engagement.status === "INVOICED" ? "Void invoice and cancel" : "Cancel booking"}
          </Button>
        </div>
      )}
    </form>
  );
}
