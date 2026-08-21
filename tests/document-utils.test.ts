import test from "node:test";
import assert from "node:assert/strict";
import { calculateNextReviewDate, parseDateInput } from "../src/lib/document-utils";

test("calculateNextReviewDate legger til måneder og bevarer dato", () => {
  const base = new Date("2025-01-15");
  const next = calculateNextReviewDate(base, 6);
  assert.equal(next.toISOString().slice(0, 10), "2025-07-15");
});

test("calculateNextReviewDate håndterer måneder med færre dager", () => {
  const base = new Date("2025-01-31");
  const next = calculateNextReviewDate(base, 1);
  assert.equal(next.toISOString().slice(0, 10), "2025-02-28");
});

test("parseDateInput returnerer null for ugyldig dato", () => {
  assert.equal(parseDateInput(""), null);
  assert.equal(parseDateInput("ugyldig"), null);
});

test("parseDateInput returnerer Date for gyldig verdi", () => {
  const parsed = parseDateInput("2025-03-01");
  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.toISOString().slice(0, 10), "2025-03-01");
});


