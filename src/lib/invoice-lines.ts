export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitAmount: number;
};

export type InvoiceCustomerInput = {
  email: string;
  addressLine1: string;
  city: string;
  postcode: string;
  vatNumber: string | null;
  purchaseOrderNumber: string | null;
};

export function requireInvoiceCustomer(input: {
  email: string;
  addressLine1: string;
  city: string;
  postcode: string;
  vatNumber?: string | null;
  purchaseOrderNumber?: string | null;
}): InvoiceCustomerInput {
  const email = input.email.trim();
  const addressLine1 = input.addressLine1.trim();
  const city = input.city.trim();
  const postcode = input.postcode.trim().toUpperCase();
  const vatNumber = input.vatNumber?.replace(/\s+/g, "").toUpperCase() || null;
  const purchaseOrderNumber = input.purchaseOrderNumber?.trim() || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw { code: "INVOICE_EMAIL_MISSING", message: "Enter an invoice email" };
  }
  if (!addressLine1) {
    throw { code: "INVOICE_ADDRESS_MISSING", message: "Enter the first line of the invoice address" };
  }
  if (!city) {
    throw { code: "INVOICE_ADDRESS_MISSING", message: "Enter the invoice city" };
  }
  if (postcode.length < 2) {
    throw { code: "INVOICE_ADDRESS_MISSING", message: "Enter the invoice postcode" };
  }
  if (vatNumber && !/^GB\d{9}(\d{3})?$/.test(vatNumber.startsWith("GB") ? vatNumber : `GB${vatNumber}`)) {
    throw { code: "VAT_NUMBER_REJECTED", message: "Enter a GB VAT number, for example GB123456789" };
  }

  return { email, addressLine1, city, postcode, vatNumber, purchaseOrderNumber };
}

const DAY_MS = 86_400_000;

export function defaultInvoiceDueDate(now = new Date()): string {
  const due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30));
  return due.toISOString().slice(0, 10);
}

export function daysUntilInvoiceDue(dueDate: string, now = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw { code: "INVALID_DUE_DATE", message: "Choose a due date" };
  }
  const due = Date.parse(`${dueDate}T00:00:00.000Z`);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((due - start) / DAY_MS);
  if (!Number.isFinite(days) || days < 1) {
    throw { code: "INVALID_DUE_DATE", message: "Due date must be at least one day from today" };
  }
  if (days > 365) {
    throw { code: "INVALID_DUE_DATE", message: "Due date must be within a year" };
  }
  return days;
}

export function poundsToPence(pounds: number): number {
  if (!Number.isFinite(pounds) || pounds <= 0 || pounds > 1_000_000) {
    throw { code: "INVALID_AMOUNT", message: "Enter a unit price greater than zero" };
  }
  const pence = Math.round((pounds + Number.EPSILON) * 100);
  if (pence < 1) {
    throw { code: "INVALID_AMOUNT", message: "Enter a unit price greater than zero" };
  }
  return pence;
}

export function invoiceLineSummary(lines: InvoiceLineInput[]): string {
  return lines
    .map((line) => {
      const unit = line.unitAmount.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${line.description} × ${line.quantity} @ £${unit}`;
    })
    .join("\n");
}

export function invoiceLinesTotalPounds(lines: InvoiceLineInput[]): number {
  const pence = lines.reduce((sum, line) => sum + poundsToPence(line.unitAmount) * line.quantity, 0);
  return pence / 100;
}
