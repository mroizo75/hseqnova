"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendTenantInvoice } from "@/server/actions/send-invoice.actions";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";

export type InvoiceTenantOption = {
  id: string;
  name: string;
  invoiceEmail: string | null;
  contactEmail: string | null;
  invoiceAddress: string | null;
  address: string | null;
  invoiceCity: string | null;
  city: string | null;
  invoicePostalCode: string | null;
  postalCode: string | null;
  vatNumber: string | null;
  purchaseOrderNumber: string | null;
  stripeCustomerId: string | null;
};

type CustomerDraft = {
  email: string;
  addressLine1: string;
  city: string;
  postcode: string;
  vatNumber: string;
  purchaseOrderNumber: string;
};

function customerDraft(source?: {
  invoiceEmail?: string | null;
  contactEmail?: string | null;
  email?: string | null;
  invoiceAddress?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  invoiceCity?: string | null;
  city?: string | null;
  invoicePostalCode?: string | null;
  postalCode?: string | null;
  postcode?: string | null;
  vatNumber?: string | null;
  purchaseOrderNumber?: string | null;
} | null): CustomerDraft {
  return {
    email: source?.email || source?.invoiceEmail || source?.contactEmail || "",
    addressLine1: source?.addressLine1 || source?.invoiceAddress || source?.address || "",
    city: source?.invoiceCity || source?.city || "",
    postcode: source?.postcode || source?.invoicePostalCode || source?.postalCode || "",
    vatNumber: source?.vatNumber || "",
    purchaseOrderNumber: source?.purchaseOrderNumber || "",
  };
}

type DraftLine = {
  key: string;
  description: string;
  quantity: string;
  unitAmount: string;
};

type SentInvoice = {
  invoiceNumber: string | null;
  hostedInvoiceUrl: string | null;
  livemode: boolean;
  warning?: string;
};

function blankLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitAmount: "",
  };
}

function money(pounds: number): string {
  return pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface SendInvoiceFormProps {
  defaultDueDate: string;
  tenantId?: string;
  hasStripeCustomer?: boolean;
  customer?: CustomerDraft;
  tenants?: InvoiceTenantOption[];
}

export function SendInvoiceForm({
  defaultDueDate,
  tenantId,
  hasStripeCustomer = false,
  customer,
  tenants,
}: SendInvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId ?? "");
  const [billTo, setBillTo] = useState<CustomerDraft>(customer ?? customerDraft());
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<SentInvoice | null>(null);

  const locked = Boolean(tenantId);
  const selected = tenants?.find((tenant) => tenant.id === selectedTenantId);
  const creatingCustomer = locked ? !hasStripeCustomer : !selected?.stripeCustomerId;

  useEffect(() => {
    if (locked) return;
    setBillTo(customerDraft(selected));
  }, [locked, selected]);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const quantity = Number(line.quantity);
      const unit = Number(line.unitAmount);
      if (!Number.isFinite(quantity) || !Number.isFinite(unit) || quantity < 1 || unit <= 0) return sum;
      return sum + quantity * unit;
    }, 0);
  }, [lines]);

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTenantId) {
      toast({ variant: "destructive", title: "Choose a company" });
      return;
    }

    const parsedLines = lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitAmount: Number(line.unitAmount),
    }));
    if (parsedLines.some((line) => !line.description || !Number.isInteger(line.quantity) || line.quantity < 1 || !(line.unitAmount > 0))) {
      toast({
        variant: "destructive",
        title: "Check the lines",
        description: "Each line needs a description, a quantity, and a unit price.",
      });
      return;
    }

    setSubmitting(true);
    const result = await sendTenantInvoice({
      tenantId: selectedTenantId,
      dueDate,
      note: note.trim() || undefined,
      lines: parsedLines,
      customer: {
        email: billTo.email,
        addressLine1: billTo.addressLine1,
        city: billTo.city,
        postcode: billTo.postcode,
        vatNumber: billTo.vatNumber || undefined,
        purchaseOrderNumber: billTo.purchaseOrderNumber || undefined,
      },
    });
    setSubmitting(false);

    if (result.success === false) {
      toast({ variant: "destructive", title: "Could not send invoice", description: result.error });
      return;
    }

    setSent({
      invoiceNumber: result.invoiceNumber,
      hostedInvoiceUrl: result.hostedInvoiceUrl,
      livemode: result.livemode,
      warning: result.warning,
    });
    toast({
      title: result.livemode ? "Invoice sent" : "Invoice created in test mode",
      description: result.livemode
        ? `Stripe emailed ${billTo.email}.`
        : "Stripe does not email invoices in test mode. Open the invoice to collect payment.",
    });
    router.refresh();
  }

  if (sent) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">
          {sent.livemode ? "Invoice sent" : "Test invoice created"}
          {sent.invoiceNumber ? ` · ${sent.invoiceNumber}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {sent.livemode
            ? `Stripe emailed the invoice to ${billTo.email}.`
            : "Stripe does not email invoices in test mode. Use the payment page below."}
        </p>
        {sent.warning ? <p className="text-sm text-destructive">{sent.warning}</p> : null}
        <div className="flex flex-wrap gap-2">
          {sent.hostedInvoiceUrl ? (
            <Button asChild variant="outline">
              <a href={sent.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                Open invoice
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSent(null);
              setLines([blankLine()]);
              setNote("");
            }}
          >
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {locked ? null : (
        <div className="space-y-2">
          <Label>Company</Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a company" />
            </SelectTrigger>
            <SelectContent>
              {(tenants ?? []).map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Bill to</p>
          <p className="text-xs text-muted-foreground">
            {creatingCustomer
              ? "Stripe has no customer for this company yet. These details create one and are saved on the company."
              : "Stripe emails this address. Saving updates the customer in Stripe."}
            {" "}Country is the United Kingdom.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="invoice-email">Invoice email</Label>
            <Input
              id="invoice-email"
              type="email"
              value={billTo.email}
              onChange={(event) => setBillTo((current) => ({ ...current, email: event.target.value }))}
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="invoice-address">Address</Label>
            <Input
              id="invoice-address"
              value={billTo.addressLine1}
              onChange={(event) => setBillTo((current) => ({ ...current, addressLine1: event.target.value }))}
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-city">City</Label>
            <Input
              id="invoice-city"
              value={billTo.city}
              onChange={(event) => setBillTo((current) => ({ ...current, city: event.target.value }))}
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-postcode">Postcode</Label>
            <Input
              id="invoice-postcode"
              value={billTo.postcode}
              onChange={(event) => setBillTo((current) => ({ ...current, postcode: event.target.value }))}
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-vat">VAT number (optional)</Label>
            <Input
              id="invoice-vat"
              value={billTo.vatNumber}
              onChange={(event) => setBillTo((current) => ({ ...current, vatNumber: event.target.value }))}
              placeholder="GB123456789"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice-po">Purchase order (optional)</Label>
            <Input
              id="invoice-po"
              value={billTo.purchaseOrderNumber}
              onChange={(event) => setBillTo((current) => ({ ...current, purchaseOrderNumber: event.target.value }))}
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoice-due">Due date</Label>
          <Input
            id="invoice-due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label>Total ex VAT</Label>
          <p className="flex h-11 items-center text-sm font-medium sm:h-9">£{money(total)}</p>
        </div>
      </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>What they are paying for</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting || lines.length >= 20}
              onClick={() => setLines((current) => [...current, blankLine()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
          </div>
          <div className="hidden gap-2 text-xs text-muted-foreground md:grid md:grid-cols-[1fr_5rem_8rem_auto]">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price (£)</span>
          </div>
        {lines.map((line, index) => (
          <div key={line.key} className="grid gap-2 md:grid-cols-[1fr_5rem_8rem_auto]">
            <Input
              aria-label={`Description ${index + 1}`}
              value={line.description}
              onChange={(event) => updateLine(line.key, { description: event.target.value })}
              placeholder="e.g. HSEQ Nova Core, annual"
              disabled={submitting}
              required
            />
            <Input
              aria-label={`Quantity ${index + 1}`}
              type="number"
              min={1}
              max={999}
              step={1}
              value={line.quantity}
              onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
              disabled={submitting}
              required
            />
            <Input
              aria-label={`Unit price ${index + 1}`}
              type="number"
              min={0.01}
              step={0.01}
              value={line.unitAmount}
              onChange={(event) => updateLine(line.key, { unitAmount: event.target.value })}
              placeholder="£"
              disabled={submitting}
              required
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Remove line ${index + 1}`}
              disabled={submitting || lines.length === 1}
              onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Amounts are exclusive of VAT. Reverse charge applies where the customer is VAT-registered.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice-note">Note on the invoice (optional)</Label>
        <textarea
          id="invoice-note"
          className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Shown in the invoice footer."
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || (!locked && !selectedTenantId)}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {creatingCustomer ? "Create customer and send" : "Send invoice"}
        </Button>
      </div>
    </form>
  );
}
