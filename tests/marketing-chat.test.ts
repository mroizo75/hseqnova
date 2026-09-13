import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ANNUAL_DISCOUNT_PERCENT, HSEQ_CORE } from "../src/lib/billing-catalog";
import {
  buildMarketingKnowledge,
  recommendPacksForCompany,
} from "../src/lib/marketing-chat-knowledge";
import { marketingChatRequestSchema } from "../src/lib/validations/marketing-chat";

describe("HSEQ Nova public product guide", () => {
  it("grounds answers in live Core and yearly prices", () => {
    const knowledge = buildMarketingKnowledge();
    assert.match(knowledge, new RegExp(String(HSEQ_CORE.monthlyPriceGbp)));
    assert.match(knowledge, /10%/);
    assert.match(knowledge, new RegExp(String(ANNUAL_DISCOUNT_PERCENT)));
    assert.match(knowledge, /customer's records/i);
    assert.match(knowledge, /RAMS/);
    assert.match(knowledge, /COSHH/);
  });

  it("recommends construction packs and leaves offices on Core", () => {
    const construction = recommendPacksForCompany("We are a principal contractor on a building site");
    assert.deepEqual(
      construction.map((item) => item.packId),
      ["rams", "cdm", "safety-board"],
    );
    assert.deepEqual(recommendPacksForCompany("We run a small office in Leeds"), []);
  });

  it("rejects an empty chat payload", () => {
    const parsed = marketingChatRequestSchema.safeParse({ messages: [] });
    assert.equal(parsed.success, false);
  });
});
