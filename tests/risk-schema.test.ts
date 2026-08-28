import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { recordIdSchema, updateRiskSchema } from "../src/features/risks/schemas/risk.schema";

describe("risk record ids", () => {
  it("accepts createId, prisma cuid and UUID owner ids", () => {
    assert.equal(recordIdSchema.parse("c63ceaf97fcf83dd3103a8234"), "c63ceaf97fcf83dd3103a8234");
    assert.equal(
      recordIdSchema.parse("550e8400-e29b-41d4-a716-446655440000"),
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("lets an update through when ownerId is not a classic cuid", () => {
    const parsed = updateRiskSchema.parse({
      id: "c63ceaf97fcf83dd3103a8234",
      ownerId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Working at height",
    });
    assert.equal(parsed.ownerId, "550e8400-e29b-41d4-a716-446655440000");
  });
});
