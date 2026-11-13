import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safetyCheckEmailHtml } from "../src/lib/safety-check-email";
import {
  assessSafetyCheck,
  bandForScore,
  PRIORITY_CTA,
  SAFETY_CHECK_RECIPIENT,
  SAFETY_INDUSTRIES,
  scoreFromPoints,
} from "../src/lib/safety-check";
import { deliverSafetyCheck } from "../src/lib/safety-check-submit";

function answers(industryId: string, points: readonly number[]): string[] {
  const industry = SAFETY_INDUSTRIES.find((item) => item.id === industryId);
  assert.ok(industry);
  return points.map((point, index) => industry.questions[index]!.options[point]!.id);
}

describe("safety check catalogue", () => {
  it("has five industries, six questions and four scored answers", () => {
    assert.equal(SAFETY_INDUSTRIES.length, 5);
    for (const industry of SAFETY_INDUSTRIES) {
      assert.equal(industry.questions.length, 6);
      for (const question of industry.questions) {
        assert.equal(question.options.length, 4);
        assert.deepEqual(
          question.options.map((option) => option.points),
          [0, 1, 2, 3],
        );
      }
    }
  });
});

describe("safety check scoring", () => {
  it("scores zero, a mid-range mix and a full mark out of 100", () => {
    assert.equal(scoreFromPoints([0, 0, 0, 0, 0, 0]), 0);
    assert.equal(scoreFromPoints([2, 2, 2, 2, 2, 2]), 67);
    assert.equal(scoreFromPoints([3, 3, 3, 3, 3, 3]), 100);
  });

  it("places the three bands on the score boundaries", () => {
    assert.equal(bandForScore(0), "priority");
    assert.equal(bandForScore(49), "priority");
    assert.equal(bandForScore(50), "strengthen");
    assert.equal(bandForScore(79), "strengthen");
    assert.equal(bandForScore(80), "maintain");
    assert.equal(bandForScore(100), "maintain");
  });

  it("writes a priority message from the weakest answers", () => {
    const result = assessSafetyCheck("construction", answers("construction", [0, 0, 0, 1, 1, 3]));
    assert.ok(result);
    assert.equal(result.score, 28);
    assert.equal(result.band, "priority");
    assert.match(result.message, new RegExp(`Your score of ${result.score} out of 100`));
    assert.match(result.message, /Prioritise those gaps/);
    assert.ok(result.message.includes(PRIORITY_CTA));
    assert.match(result.message, /written health and safety policy/);
    assert.equal(result.recommendations.length, 3);
    assert.match(result.recommendations[0]!, /written policy/);
  });

  it("uses a strengthen message in the middle band", () => {
    const result = assessSafetyCheck("office", answers("office", [2, 2, 2, 2, 2, 2]));
    assert.ok(result);
    assert.equal(result.score, 67);
    assert.equal(result.band, "strengthen");
    assert.match(result.message, /opportunity to build on what you already do/);
    assert.equal(result.message.includes(PRIORITY_CTA), false);
  });

  it("uses a maintain message for a high score", () => {
    const result = assessSafetyCheck("care", answers("care", [3, 3, 3, 3, 3, 3]));
    assert.ok(result);
    assert.equal(result.score, 100);
    assert.equal(result.band, "maintain");
    assert.match(result.message, /largely in place/);
    assert.match(result.message, /maintain the review/);
    assert.match(result.recommendations[0]!, /dated review/);
  });
});

describe("safety check submission", () => {
  it("emails Callum the score, answers and a reply path", async () => {
    const sent: Array<{ to: string; subject: string; html: string; replyTo?: string }> = [];
    const response = await deliverSafetyCheck(
      {
        name: "Jane Smith",
        company: "Smith Builders Ltd",
        email: "jane@smithbuilders.co.uk",
        consent: true,
        industryId: "construction",
        answerIds: answers("construction", [1, 1, 1, 2, 2, 2]),
        website: "",
      },
      async (message) => {
        sent.push(message);
      },
    );

    assert.deepEqual(response, { success: true });
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.to, SAFETY_CHECK_RECIPIENT);
    assert.equal(SAFETY_CHECK_RECIPIENT, "callum@hseqnova.co.uk");
    assert.equal(sent[0]?.replyTo, "jane@smithbuilders.co.uk");
    assert.match(sent[0]?.subject ?? "", /Smith Builders Ltd/);
    assert.match(sent[0]?.html ?? "", /Jane Smith/);
    assert.match(sent[0]?.html ?? "", /\/ 100/);
    assert.match(sent[0]?.html ?? "", /We rely on experience on the day|A supervisor explains/);
  });

  it("escapes names in the email and refuses a missing consent", async () => {
    const html = safetyCheckEmailHtml(
      { name: `<script>alert("x")</script>`, company: "A&B Ltd", email: "a@b.co.uk" },
      assessSafetyCheck("transport", answers("transport", [3, 3, 3, 3, 3, 2]))!,
    );
    assert.equal(html.includes("<script>"), false);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /A&amp;B Ltd/);

    let called = false;
    const refused = await deliverSafetyCheck(
      {
        name: "Jane Smith",
        company: "Smith Builders Ltd",
        email: "not-an-email",
        consent: false,
        industryId: "office",
        answerIds: answers("office", [0, 0, 0, 0, 0, 0]),
      },
      async () => {
        called = true;
      },
    );
    assert.equal(refused.success, false);
    if (!refused.success) assert.equal(refused.error.code, "CONSENT_REQUIRED");
    assert.equal(called, false);
  });

  it("does not send when the honeypot is filled", async () => {
    let called = false;
    const response = await deliverSafetyCheck(
      {
        name: "Jane Smith",
        company: "Smith Builders Ltd",
        email: "jane@smithbuilders.co.uk",
        consent: true,
        industryId: "manufacturing",
        answerIds: answers("manufacturing", [3, 3, 3, 3, 3, 3]),
        website: "https://spam.example",
      },
      async () => {
        called = true;
      },
    );
    assert.deepEqual(response, { success: true });
    assert.equal(called, false);
  });
});
