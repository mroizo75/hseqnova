import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HSEQ_CORE } from "../src/lib/billing-catalog";
import { formatGbp, getHomePageJsonLd, HOME_FAQS } from "../src/lib/homepage-content";

describe("homepage content", () => {
  it("formats Core price in GBP", () => {
    assert.equal(formatGbp(HSEQ_CORE.monthlyPriceGbp), "£29.00");
  });

  it("builds FAQ and SoftwareApplication schema without competitor claims", () => {
    const schemas = getHomePageJsonLd();
    const types = schemas.map((schema) => schema["@type"]);
    assert.deepEqual(types.includes("FAQPage"), true);
    assert.deepEqual(types.includes("SoftwareApplication"), true);

    const faq = schemas.find((schema) => schema["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    assert.equal(faq.mainEntity.length, HOME_FAQS.length);
    assert.equal(faq.mainEntity[0]?.name, HOME_FAQS[0].question);

    const blob = JSON.stringify(schemas);
    assert.equal(blob.includes("Citation"), false);
    assert.equal(blob.includes("Alcumus"), false);
    assert.equal(blob.includes("HMS Nova"), false);
    assert.equal(blob.includes("£29") || blob.includes("29"), true);
  });
});
