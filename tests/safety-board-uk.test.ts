import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { constructionSiteInformationChecks } from "../src/lib/safety-board-uk";

describe("constructionSiteInformationChecks", () => {
  it("treats an active construction phase plan as in place", () => {
    const items = constructionSiteInformationChecks({
      cppStatus: "ACTIVE",
      f10: {
        status: "DRAFT",
        expectedStartDate: "2026-04-06",
        expectedEndDate: "2026-04-10",
        maxWorkersSimultaneous: 5,
      },
    });
    const cpp = items.find((item) => item.label.includes("Construction phase plan"));
    assert.equal(cpp?.ok, true);
    const f10 = items.find((item) => item.label.includes("F10"));
    assert.equal(f10?.ok, true);
    assert.match(f10?.label ?? "", /not required/i);
  });

  it("flags F10 only when the project is notifiable and the notice is not submitted", () => {
    const items = constructionSiteInformationChecks({
      cppStatus: "ACTIVE",
      f10: {
        status: "DRAFT",
        expectedStartDate: "2026-01-05",
        expectedEndDate: "2026-03-27",
        maxWorkersSimultaneous: 25,
      },
      checkinsToday: 0,
    });
    const f10 = items.find((item) => item.label.includes("F10"));
    assert.equal(f10?.ok, false);
    assert.match(f10?.label ?? "", /site office/i);
    const roster = items.find((item) => item.label.includes("Site register"));
    assert.equal(roster?.ok, false);
    assert.match(roster?.label ?? "", /not a CDM duty/);
  });
});
