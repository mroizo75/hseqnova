import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  daysUntilInvoiceDue,
  defaultInvoiceDueDate,
  invoiceLineSummary,
  invoiceLinesTotalPounds,
  poundsToPence,
  requireInvoiceCustomer,
} from "../src/lib/invoice-lines";

const now = new Date("2026-11-17T15:00:00.000Z");

describe("invoice lines", () => {
  it("defaults the due date to 30 days and rejects today", () => {
    assert.equal(defaultInvoiceDueDate(now), "2026-12-17");
    assert.equal(daysUntilInvoiceDue("2026-12-17", now), 30);
    assert.throws(
      () => daysUntilInvoiceDue("2026-11-17", now),
      (error: unknown) =>
        Boolean(error && typeof error === "object" && "message" in error && String(error.message).includes("at least one day")),
    );
  });

  it("sums exclusive unit prices in pence", () => {
    assert.equal(poundsToPence(19.99), 1999);
    assert.equal(
      invoiceLinesTotalPounds([
        { description: "Core", quantity: 1, unitAmount: 1200 },
        { description: "Workshop", quantity: 2, unitAmount: 450.5 },
      ]),
      2101,
    );
    assert.match(invoiceLineSummary([{ description: "Core", quantity: 1, unitAmount: 1200 }]), /Core × 1 @ £1,200\.00/);
  });

  it("requires the customer details Stripe needs on an invoice", () => {
    assert.deepEqual(
      requireInvoiceCustomer({
        email: " accounts@example.co.uk ",
        addressLine1: "1 High Street",
        city: "London",
        postcode: "sw1a 1aa",
        vatNumber: "123456789",
      }),
      {
        email: "accounts@example.co.uk",
        addressLine1: "1 High Street",
        city: "London",
        postcode: "SW1A 1AA",
        vatNumber: "123456789",
        purchaseOrderNumber: null,
      },
    );
    assert.throws(
      () => requireInvoiceCustomer({ email: "accounts@example.co.uk", addressLine1: "", city: "London", postcode: "SW1A 1AA" }),
      (error: unknown) =>
        Boolean(error && typeof error === "object" && "message" in error && String(error.message).includes("address")),
    );
  });
});
