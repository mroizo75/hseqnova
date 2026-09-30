import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import {
  GOOGLE_TOKEN_URL,
  SEARCH_CONSOLE_SCOPE,
  buildComparisonRanges,
  buildServiceAccountAssertion,
  findStrikingDistance,
  normalizePrivateKey,
  parseRangeParam,
  percentChange,
  resolveSearchConsoleProperty,
  resolveSitemapUrl,
  urlToPath,
  type SearchAnalyticsRow,
} from "../src/lib/google/search-console-core";

function row(query: string, impressions: number, position: number): SearchAnalyticsRow {
  return { keys: [query], clicks: 0, impressions, ctr: 0, position };
}

describe("buildComparisonRanges", () => {
  it("ends yesterday in Pacific Time and mirrors the previous window", () => {
    const ranges = buildComparisonRanges(28, new Date("2026-09-30T12:00:00Z"));
    assert.deepEqual(ranges.current, { startDate: "2026-09-02", endDate: "2026-09-29" });
    assert.deepEqual(ranges.previous, { startDate: "2026-08-05", endDate: "2026-09-01" });
  });

  it("uses the Pacific date when UTC has already rolled over", () => {
    const ranges = buildComparisonRanges(7, new Date("2026-10-01T03:00:00Z"));
    assert.equal(ranges.current.endDate, "2026-09-29");
    assert.equal(ranges.current.startDate, "2026-09-23");
  });
});

describe("parseRangeParam", () => {
  it("accepts the supported ranges", () => {
    assert.equal(parseRangeParam("7"), 7);
    assert.equal(parseRangeParam("90"), 90);
  });

  it("falls back to 28 days for anything else", () => {
    assert.equal(parseRangeParam(undefined), 28);
    assert.equal(parseRangeParam("365"), 28);
    assert.equal(parseRangeParam("abc"), 28);
  });
});

describe("percentChange", () => {
  it("returns the relative change", () => {
    assert.equal(percentChange(150, 100), 50);
    assert.equal(percentChange(50, 100), -50);
  });

  it("handles an empty previous period", () => {
    assert.equal(percentChange(0, 0), 0);
    assert.equal(percentChange(10, 0), null);
  });
});

describe("findStrikingDistance", () => {
  it("keeps positions 4–20 with demand, ordered by impressions", () => {
    const result = findStrikingDistance([
      row("riddor reporting", 400, 8.2),
      row("coshh assessment template", 900, 12.5),
      row("hseq nova", 1200, 1.1),
      row("accident book", 5, 6),
      row("rams template", 300, 24),
    ]);
    assert.deepEqual(
      result.map((entry) => entry.keys?.[0]),
      ["coshh assessment template", "riddor reporting"]
    );
  });

  it("returns an empty list when nothing qualifies", () => {
    assert.deepEqual(findStrikingDistance([row("brand", 1000, 1)]), []);
  });
});

describe("resolveSearchConsoleProperty", () => {
  it("derives a Domain property from the site URL", () => {
    assert.equal(resolveSearchConsoleProperty("https://www.hseqnova.co.uk", undefined), "sc-domain:hseqnova.co.uk");
  });

  it("prefers an explicit override", () => {
    assert.equal(
      resolveSearchConsoleProperty("https://hseqnova.co.uk", " https://hseqnova.co.uk/ "),
      "https://hseqnova.co.uk/"
    );
  });
});

describe("resolveSitemapUrl", () => {
  it("uses the site URL when it belongs to the property", () => {
    assert.equal(
      resolveSitemapUrl("https://www.hseqnova.co.uk", "sc-domain:hseqnova.co.uk"),
      "https://www.hseqnova.co.uk/sitemap.xml"
    );
  });

  it("falls back to the property domain when running on localhost", () => {
    assert.equal(
      resolveSitemapUrl("http://localhost:3000", "sc-domain:hseqnova.co.uk"),
      "https://hseqnova.co.uk/sitemap.xml"
    );
  });
});

describe("urlToPath", () => {
  it("strips the origin", () => {
    assert.equal(urlToPath("https://hseqnova.co.uk/news/riddor?x=1"), "/news/riddor?x=1");
  });

  it("returns non-URLs unchanged", () => {
    assert.equal(urlToPath("not a url"), "not a url");
  });
});

describe("buildServiceAccountAssertion", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

  it("produces an RS256 JWT with Google's claims that verifies with the public key", () => {
    const now = new Date("2026-09-30T10:00:00Z");
    const jwt = buildServiceAccountAssertion({
      clientEmail: "seo@project.iam.gserviceaccount.com",
      privateKey: normalizePrivateKey(JSON.stringify(pem).slice(1, -1)),
      scope: SEARCH_CONSOLE_SCOPE,
      now,
    });
    const [header, claims, signature] = jwt.split(".");
    assert.deepEqual(JSON.parse(Buffer.from(header, "base64url").toString()), { alg: "RS256", typ: "JWT" });

    const payload = JSON.parse(Buffer.from(claims, "base64url").toString());
    assert.equal(payload.iss, "seo@project.iam.gserviceaccount.com");
    assert.equal(payload.aud, GOOGLE_TOKEN_URL);
    assert.equal(payload.scope, SEARCH_CONSOLE_SCOPE);
    assert.equal(payload.exp - payload.iat, 3600);

    const verified = createVerify("RSA-SHA256")
      .update(`${header}.${claims}`)
      .verify(publicKey, Buffer.from(signature, "base64url"));
    assert.equal(verified, true);
  });

  it("throws on an invalid key", () => {
    assert.throws(() =>
      buildServiceAccountAssertion({
        clientEmail: "seo@project.iam.gserviceaccount.com",
        privateKey: "not-a-key",
        scope: SEARCH_CONSOLE_SCOPE,
        now: new Date(),
      })
    );
  });
});
