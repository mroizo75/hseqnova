import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildArticleJsonLd,
  estimateReadingMinutes,
  normalizeDbTimestamp,
  parsePageParam,
  slugify,
} from "../src/lib/news/news-content";
import { sanitizeArticleHtml } from "../src/lib/news/news-sanitize";
import { articleInputSchema, type ArticleInput } from "../src/lib/validations/news";

const validInput: ArticleInput = {
  title: "When to report an injury under RIDDOR",
  slug: "when-to-report-an-injury-under-riddor",
  excerpt: "Deaths are reported without delay, specified injuries within 10 days and over-seven-day injuries within 15 days.",
  content: "<h2>Deadlines</h2><p>RIDDOR 2013 reg. 4 sets the deadlines.</p>",
  coverImage: "",
  coverImageAlt: "",
  categoryId: "",
  status: "DRAFT",
  publishedAt: "",
  metaTitle: "",
  metaDescription: "",
};

describe("slugify", () => {
  it("turns a headline into a URL slug", () => {
    assert.equal(slugify("COSHH Assessments: A Practical Guide"), "coshh-assessments-a-practical-guide");
  });

  it("strips accents, ampersands and repeated separators", () => {
    assert.equal(slugify("  Café -- Health & Safety  "), "cafe-health-and-safety");
    assert.equal(slugify("---"), "");
  });
});

describe("sanitizeArticleHtml", () => {
  it("keeps headings, images with alt and links", () => {
    const html = sanitizeArticleHtml(
      '<h2>Duties</h2><p><a href="https://www.hse.gov.uk/riddor/">HSE</a></p><img src="/api/files/blog/images/1-a.png" alt="Accident book">'
    );
    assert.match(html, /<h2>Duties<\/h2>/);
    assert.match(html, /href="https:\/\/www\.hse\.gov\.uk\/riddor\/"/);
    assert.match(html, /alt="Accident book"/);
  });

  it("removes scripts, event handlers and javascript: URLs, and demotes h1", () => {
    const html = sanitizeArticleHtml(
      '<h1>Title</h1><script>alert(1)</script><img src="x.png" onerror="alert(1)"><a href="javascript:alert(1)">x</a>'
    );
    assert.doesNotMatch(html, /<script/i);
    assert.doesNotMatch(html, /onerror/i);
    assert.doesNotMatch(html, /javascript:/i);
    assert.doesNotMatch(html, /<h1/i);
    assert.match(html, /<h2>Title<\/h2>/);
  });
});

describe("estimateReadingMinutes", () => {
  it("estimates from word count", () => {
    const words = Array.from({ length: 690 }, () => "word").join(" ");
    assert.equal(estimateReadingMinutes(`<p>${words}</p>`), 3);
  });

  it("returns at least one minute for empty content", () => {
    assert.equal(estimateReadingMinutes(""), 1);
    assert.equal(estimateReadingMinutes("<p></p>"), 1);
  });
});

describe("parsePageParam", () => {
  it("defaults to page 1 and accepts positive integers", () => {
    assert.equal(parsePageParam(undefined), 1);
    assert.equal(parsePageParam("3"), 3);
    assert.equal(parsePageParam(["2", "5"]), 2);
  });

  it("rejects zero, negatives and non-numeric values", () => {
    assert.equal(parsePageParam("0"), null);
    assert.equal(parsePageParam("-1"), null);
    assert.equal(parsePageParam("abc"), null);
  });
});

describe("normalizeDbTimestamp", () => {
  it("treats timestamps without an offset as UTC", () => {
    assert.equal(normalizeDbTimestamp("2026-09-30T08:15:00.123"), "2026-09-30T08:15:00.123Z");
    assert.equal(normalizeDbTimestamp("2026-09-30 08:15:00"), "2026-09-30T08:15:00.000Z");
  });

  it("keeps explicit offsets and handles null", () => {
    assert.equal(normalizeDbTimestamp("2026-09-30T10:15:00+02:00"), "2026-09-30T08:15:00.000Z");
    assert.equal(normalizeDbTimestamp(null), null);
  });
});

describe("buildArticleJsonLd", () => {
  const base = {
    title: "RIDDOR deadlines explained",
    slug: "riddor-deadlines-explained",
    excerpt: "What to report and when.",
    metaDescription: null,
    coverImage: null,
    publishedAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-02T09:00:00.000Z",
    authorName: "Callum",
    category: { id: "c1", name: "RIDDOR", slug: "riddor", description: null },
  };

  it("builds NewsArticle and BreadcrumbList with an absolute image URL", () => {
    const [article, breadcrumb] = buildArticleJsonLd({
      ...base,
      coverImage: "/api/files/blog/images/1-cover.jpg",
    });
    assert.equal(article["@type"], "NewsArticle");
    assert.equal(article.datePublished, base.publishedAt);
    assert.deepEqual(article.author, { "@type": "Person", name: "Callum" });
    const images = article.image as string[];
    assert.match(images[0], /^https?:\/\/.+\/api\/files\/blog\/images\/1-cover\.jpg$/);
    const crumbs = breadcrumb.itemListElement as Array<{ name: string }>;
    assert.deepEqual(
      crumbs.map((crumb) => crumb.name),
      ["Home", "News", "RIDDOR", "RIDDOR deadlines explained"]
    );
  });

  it("omits image and falls back to the organisation as author", () => {
    const [article] = buildArticleJsonLd({ ...base, authorName: null, category: null });
    assert.equal("image" in article, false);
    assert.equal((article.author as { "@type": string })["@type"], "Organization");
  });
});

describe("articleInputSchema", () => {
  it("accepts a valid draft", () => {
    assert.equal(articleInputSchema.safeParse(validInput).success, true);
  });

  it("rejects a cover image without alt text", () => {
    const result = articleInputSchema.safeParse({
      ...validInput,
      coverImage: "/api/files/blog/images/1-cover.jpg",
    });
    assert.equal(result.success, false);
    assert.equal(result.error?.issues[0]?.path[0], "coverImageAlt");
  });

  it("rejects a malformed slug and an empty body", () => {
    assert.equal(articleInputSchema.safeParse({ ...validInput, slug: "Not A Slug" }).success, false);
    assert.equal(articleInputSchema.safeParse({ ...validInput, content: "<p> </p>" }).success, false);
  });
});
