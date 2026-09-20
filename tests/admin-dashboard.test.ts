import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAttentionQueue,
  daysUntil,
  greetingForHour,
  monthlyRecurringGbp,
  organisationInitials,
  organisationLiveMix,
} from "../src/lib/admin-dashboard";

test("greetingForHour follows a UK working day", () => {
  assert.equal(greetingForHour(8), "Good morning");
  assert.equal(greetingForHour(12), "Good afternoon");
  assert.equal(greetingForHour(17), "Good evening");
});

test("organisationInitials uses the first two words", () => {
  assert.equal(organisationInitials("North Sea Fabrication"), "NS");
  assert.equal(organisationInitials("Acme"), "AC");
  assert.equal(organisationInitials("  "), "OR");
});

test("monthlyRecurringGbp converts yearly plans and ignores cancelled", () => {
  assert.equal(
    monthlyRecurringGbp([
      { price: 1200, billingInterval: "YEARLY", status: "ACTIVE" },
      { price: 99, billingInterval: "MONTHLY", status: "ACTIVE" },
      { price: 50, billingInterval: "MONTHLY", status: "CANCELLED" },
      { price: 40, billingInterval: "MONTHLY", status: "TRIAL" },
    ]),
    239,
  );
});

test("daysUntil counts calendar days in UTC", () => {
  const now = new Date("2026-09-20T10:00:00.000Z");
  assert.equal(daysUntil(new Date("2026-09-20T23:00:00.000Z"), now), 0);
  assert.equal(daysUntil(new Date("2026-09-27T08:00:00.000Z"), now), 7);
});

test("organisationLiveMix is the paid vs trial split of live orgs", () => {
  assert.deepEqual(
    organisationLiveMix({ active: 7, trial: 3, suspended: 1, cancelled: 4 }),
    { live: 10, total: 15, activeShare: 70, trialShare: 30 },
  );
});

test("buildAttentionQueue ranks invoices and support ahead of suspended orgs", () => {
  const items = buildAttentionQueue({
    overdueInvoiceCount: 2,
    overdueInvoiceGbp: 480,
    openSupportCount: 1,
    trialsEndingSoon: 0,
    pendingRegistrations: 0,
    overdueCrmTasks: 0,
    suspendedCount: 3,
  });
  assert.deepEqual(
    items.map((item) => item.id),
    ["invoices", "support", "suspended"],
  );
  assert.match(items[0].description, /£480/);
});
