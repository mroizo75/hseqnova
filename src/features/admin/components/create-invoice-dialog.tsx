"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SendInvoiceForm, type InvoiceTenantOption } from "@/features/admin/components/send-invoice-form";

interface CreateInvoiceDialogProps {
  tenants: InvoiceTenantOption[];
  defaultDueDate: string;
}

export function CreateInvoiceDialog({ tenants, defaultDueDate }: CreateInvoiceDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Send invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send invoice</DialogTitle>
          <DialogDescription>
            Stripe creates the customer when this company does not have one, then emails the invoice.
          </DialogDescription>
        </DialogHeader>
        {open ? <SendInvoiceForm tenants={tenants} defaultDueDate={defaultDueDate} /> : null}
      </DialogContent>
    </Dialog>
  );
}
