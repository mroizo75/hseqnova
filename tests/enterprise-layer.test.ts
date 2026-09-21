import test from "node:test";
import assert from "node:assert/strict";
import {
  canScopeToPortfolios,
  getEnterprisePermissions,
  getEnterpriseRoleLabel,
} from "../src/lib/enterprise-permissions";
import {
  accessLevel,
  defaultAccessForRelationship,
  requiresCompanyConsent,
  visibilityAtLeast,
  withAnalyticsAccess,
} from "../src/lib/enterprise-visibility";
import {
  dutyLevelToBand,
  evaluateAssurance,
  overviewCounts,
  percentToBand,
  trendFromPercents,
} from "../src/lib/enterprise-assurance";
import type { HseqStatusReport } from "../src/lib/hseq-status";
import {
  countIncidents,
  compareToAverage,
  filterAnonymousRollups,
  injuryRates,
  periodKeys,
  rollupStats,
  sizeBandFromEmployeeCount,
  slugifyEnterpriseName,
} from "../src/lib/enterprise-stats";
import { getPermissions } from "../src/lib/permissions";
import {
  acceptMembership,
  evaluateAdvisorCompanyInvite,
  membershipStatusOnInvite,
  parseCompanyImportCsv,
} from "../src/lib/enterprise-membership";

test("enterprise OWNER can manage organisation; READ_ONLY cannot", () => {
  assert.equal(getEnterprisePermissions("OWNER").canManageOrganisation, true);
  assert.equal(getEnterprisePermissions("READ_ONLY").canManageOrganisation, false);
  assert.equal(getEnterprisePermissions("PORTFOLIO_MANAGER").canViewAllPortfolios, false);
  assert.equal(canScopeToPortfolios("PORTFOLIO_MANAGER"), true);
  assert.equal(getEnterpriseRoleLabel("HSEQ_MANAGER"), "HSEQ manager");
});

test("independent relationships require consent; subsidiaries do not", () => {
  assert.equal(requiresCompanyConsent("INSURED"), true);
  assert.equal(requiresCompanyConsent("CONTRACTOR"), true);
  assert.equal(requiresCompanyConsent("GROUP_SUBSIDIARY"), false);
});

test("insured default hides incident content and loss stats", () => {
  const access = defaultAccessForRelationship("INSURED");
  assert.equal(access.RISKS, "STATUS");
  assert.equal(access.INCIDENTS, "NONE");
  assert.equal(access.INCIDENT_STATS, "NONE");
  assert.equal(withAnalyticsAccess(access, true, true).INCIDENT_STATS, "AGGREGATED");
  assert.equal(withAnalyticsAccess(access, true, false).INCIDENT_STATS, "NONE");
});

test("visibility rank treats AGGREGATED as enough for STATUS", () => {
  assert.equal(visibilityAtLeast("AGGREGATED", "STATUS"), true);
  assert.equal(visibilityAtLeast("NONE", "STATUS"), false);
  assert.equal(accessLevel([{ domainKey: "RISKS", visibilityLevel: "STATUS" }], "RISKS"), "STATUS");
  assert.equal(accessLevel([], "TRAINING"), "NONE");
});

test("assurance maps duties and standard rules to a band", () => {
  const report: HseqStatusReport = {
    overallLevel: "attention",
    score: 70,
    duties: [
      {
        key: "risks",
        title: "Risk assessments",
        legalRef: "MHSWR",
        href: "/dashboard/risks",
        level: "on_track",
        headline: "Current",
        detail: "",
      },
      {
        key: "actions",
        title: "Actions",
        legalRef: "MHSWR",
        href: "/dashboard/actions",
        level: "critical",
        headline: "5 overdue",
        detail: "",
      },
    ],
    onTrackCount: 1,
    attentionCount: 0,
    criticalCount: 1,
  };
  assert.equal(dutyLevelToBand("on_track"), "GREEN");
  const result = evaluateAssurance({
    report,
    iso45001Percent: 90,
    iso9001Percent: 40,
    managementReviewCurrent: true,
    requirements: [
      { domainKey: "RISKS", ruleKey: "risks_current", threshold: null },
      { domainKey: "ACTIONS", ruleKey: "critical_actions_resolved", threshold: null },
      { domainKey: "ISO_45001", ruleKey: "iso45001_ready", threshold: 80 },
    ],
  });
  assert.equal(result.metCount, 2);
  assert.equal(result.overallPercent, 67);
  assert.equal(percentToBand(67), "AMBER");
  assert.equal(result.domainBands.RISKS, "GREEN");
  assert.equal(result.domainBands.ISO_45001, "GREEN");
  assert.equal(trendFromPercents(60, 67), "IMPROVING");
  assert.deepEqual(overviewCounts(["GREEN", "GREEN", "AMBER", "RED"]), {
    companies: 4,
    goodStanding: 2,
    attentionRequired: 1,
    criticalAttention: 1,
  });
});

test("incident counters never include narrative fields", () => {
  const now = new Date("2026-09-01T00:00:00.000Z");
  const closed = new Date("2026-09-04T00:00:00.000Z");
  const stats = countIncidents(
    [
      {
        type: "ULYKKE",
        status: "CLOSED",
        isFatal: false,
        isLostTimeIncident: true,
        lostWorkdays: 8,
        isFirstAidCase: false,
        specifiedInjury: true,
        overSevenDayInjury: true,
        riddorReportable: true,
        estimatedDamageCost: 1200,
        severity: 4,
        createdAt: now,
        closedAt: closed,
      },
      {
        type: "NESTEN",
        status: "OPEN",
        isFatal: false,
        isLostTimeIncident: false,
        lostWorkdays: 0,
        isFirstAidCase: false,
        specifiedInjury: false,
        overSevenDayInjury: false,
        riddorReportable: false,
        estimatedDamageCost: 0,
        severity: 2,
        createdAt: now,
        closedAt: null,
      },
    ],
    50,
  );
  assert.equal(stats.accidentCount, 1);
  assert.equal(stats.nearMissCount, 1);
  assert.equal(stats.riddorCount, 1);
  assert.equal(stats.lostWorkdays, 8);
  assert.equal(stats.incidentOpen, 1);
  assert.ok((stats.trir ?? 0) > 0);
  assert.equal(sizeBandFromEmployeeCount(12), "10-49");
  assert.deepEqual(injuryRates(2, 1, 10), { trir: 20, ltir: 10 });
  assert.equal(periodKeys(new Date("2026-09-20T00:00:00.000Z")).monthly, "2026-09");
});

test("benchmark rollups hide cells below k-anonymity", () => {
  const rolled = rollupStats(
    [
      {
        dimensionValue: "manufacturing",
        incidentTotal: 2,
        nearMissCount: 1,
        accidentCount: 1,
        fatalCount: 0,
        lostTimeCount: 0,
        riddorCount: 0,
        trir: 1,
        ltir: 0,
      },
      {
        dimensionValue: "manufacturing",
        incidentTotal: 3,
        nearMissCount: 0,
        accidentCount: 1,
        fatalCount: 0,
        lostTimeCount: 1,
        riddorCount: 1,
        trir: 3,
        ltir: 1,
      },
    ],
    "industry",
  );
  assert.equal(rolled[0].companyCount, 2);
  assert.equal(filterAnonymousRollups(rolled, 5).length, 0);
  assert.equal(filterAnonymousRollups([{ companyCount: 8, incidentTotal: 1 }], 5).length, 1);
});

test("membership invite and advisor invite stay narrow", () => {
  const invited = membershipStatusOnInvite({ relationshipType: "INSURED", skipConsent: true });
  assert.equal(invited.ok && invited.status, "PENDING");
  const subsidiary = membershipStatusOnInvite({ relationshipType: "GROUP_SUBSIDIARY", skipConsent: true });
  assert.equal(subsidiary.ok && subsidiary.status, "ACTIVE");
  const accepted = acceptMembership({ status: "PENDING", actorIsCompanyAdmin: true });
  assert.equal(accepted.ok, true);
  assert.equal(acceptMembership({ status: "PENDING", actorIsCompanyAdmin: false }).ok, false);
  const advisor = evaluateAdvisorCompanyInvite({
    alreadyInThisTenant: false,
    companyAdminConfirmed: true,
    hasActiveMembership: true,
    hasAdvisorAssignment: true,
    canBeExternalCompetentPerson: false,
    otherTenantCount: 2,
  });
  assert.equal(advisor.ok, true);
  const denied = evaluateAdvisorCompanyInvite({
    alreadyInThisTenant: false,
    companyAdminConfirmed: false,
    hasActiveMembership: false,
    hasAdvisorAssignment: false,
    canBeExternalCompetentPerson: false,
    otherTenantCount: 1,
  });
  assert.equal(denied.ok, false);
});

test("company RBAC stays separate from enterprise roles", () => {
  const admin = getPermissions("ADMIN");
  assert.equal(admin.canInviteUsers, true);
  assert.equal(admin.canCreateActions, true);
  assert.equal("canManageOrganisation" in admin, false);
  assert.equal(getEnterprisePermissions("OWNER").canManageOrganisation, true);
  assert.equal(getEnterprisePermissions("READ_ONLY").canInviteCompanies, false);
});

test("TRIR above book average is flagged", () => {
  assert.equal(compareToAverage(4, 2), "above");
  assert.equal(compareToAverage(1, 2), "below");
  assert.equal(compareToAverage(2.01, 2), "level");
  assert.equal(compareToAverage(null, 2), null);
});

test("CSV import parses company rows", () => {
  const rows = parseCompanyImportCsv(
    "company name,company number,email,portfolio\nABC Ltd,12345678,ops@abc.test,SME\n",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].companyName, "ABC Ltd");
  assert.equal(slugifyEnterpriseName("ABC Insurance Group"), "abc-insurance-group");
});
