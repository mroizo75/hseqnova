import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyOwnerScope,
  canUserAccessOwnedRecord,
  crmReplyToAddress,
  dealStageFromTenant,
} from "../src/features/crm/lib/scope";
import {
  adminHomePath,
  canAccessAdminPath,
  canSeeAllCrm,
  crmOwnerFilter,
  flagsFromPlatformRole,
  isSalesOnly,
  resolvePlatformRole,
} from "../src/lib/platform-access";

describe("dealStageFromTenant", () => {
  it("maps pending registrations to NEW", () => {
    assert.equal(dealStageFromTenant({ status: "TRIAL", onboardingStatus: "NOT_STARTED" }), "NEW");
    assert.equal(dealStageFromTenant({ status: "TRIAL", onboardingStatus: "ADMIN_CREATED" }), "NEW");
  });

  it("maps active customers to WON", () => {
    assert.equal(dealStageFromTenant({ status: "ACTIVE", onboardingStatus: "COMPLETED" }), "WON");
  });

  it("maps cancelled and suspended to LOST", () => {
    assert.equal(dealStageFromTenant({ status: "CANCELLED" }), "LOST");
    assert.equal(dealStageFromTenant({ status: "SUSPENDED" }), "LOST");
  });

  it("maps remaining trials to DEMO", () => {
    assert.equal(dealStageFromTenant({ status: "TRIAL", onboardingStatus: "COMPLETED" }), "DEMO");
  });
});

describe("CRM owner scope", () => {
  it("lets sales managers see every record", () => {
    const records = [
      { id: "1", ownerId: "rep-1" },
      { id: "2", ownerId: "rep-2" },
      { id: "3", ownerId: null },
    ];
    assert.deepEqual(applyOwnerScope(records, { viewerId: "mgr", canSeeAll: true }), records);
    assert.equal(canUserAccessOwnedRecord({ viewerId: "mgr", canSeeAll: true, ownerId: "rep-1" }), true);
  });

  it("lets salespeople see only their assigned records", () => {
    const records = [
      { id: "1", ownerId: "rep-1" },
      { id: "2", ownerId: "rep-2" },
      { id: "3", ownerId: null },
    ];
    assert.deepEqual(applyOwnerScope(records, { viewerId: "rep-1", canSeeAll: false }), [
      { id: "1", ownerId: "rep-1" },
    ]);
    assert.equal(
      canUserAccessOwnedRecord({ viewerId: "rep-1", canSeeAll: false, ownerId: null }),
      false,
    );
    assert.equal(
      canUserAccessOwnedRecord({ viewerId: "rep-1", canSeeAll: false, ownerId: "rep-1" }),
      true,
    );
  });
});

describe("platform access", () => {
  const superadmin = flagsFromPlatformRole("SUPERADMIN");
  const manager = flagsFromPlatformRole("SALES_MANAGER");
  const sales = flagsFromPlatformRole("SALES");
  const support = flagsFromPlatformRole("SUPPORT");

  it("resolves exclusive platform roles", () => {
    assert.equal(resolvePlatformRole(manager), "SALES_MANAGER");
    assert.equal(resolvePlatformRole(sales), "SALES");
    assert.equal(isSalesOnly(sales), true);
    assert.equal(isSalesOnly(manager), false);
    assert.equal(canSeeAllCrm(manager), true);
    assert.equal(canSeeAllCrm(sales), false);
    assert.deepEqual(crmOwnerFilter({ id: "rep-1", ...sales }), { ownerId: "rep-1" });
    assert.equal(crmOwnerFilter({ id: "mgr", ...manager }), null);
  });

  it("sends sales staff to the CRM home", () => {
    assert.equal(adminHomePath(superadmin), "/admin");
    assert.equal(adminHomePath(support), "/admin");
    assert.equal(adminHomePath(manager), "/admin/crm");
    assert.equal(adminHomePath(sales), "/admin/crm");
  });

  it("restricts salespeople to CRM and support", () => {
    assert.equal(canAccessAdminPath("/admin/crm/pipeline", sales), true);
    assert.equal(canAccessAdminPath("/admin/support", sales), true);
    assert.equal(canAccessAdminPath("/admin/tenants", sales), false);
    assert.equal(canAccessAdminPath("/admin/invoices", sales), false);
    assert.equal(canAccessAdminPath("/admin/users", sales), false);
  });

  it("lets the sales manager see all customers but not billing or users", () => {
    assert.equal(canAccessAdminPath("/admin/crm", manager), true);
    assert.equal(canAccessAdminPath("/admin/tenants", manager), true);
    assert.equal(canAccessAdminPath("/admin/registrations", manager), true);
    assert.equal(canAccessAdminPath("/admin/invoices", manager), false);
    assert.equal(canAccessAdminPath("/admin/users", manager), false);
    assert.equal(canAccessAdminPath("/admin/legal-references", manager), false);
  });

  it("keeps support off the CRM and billing", () => {
    assert.equal(canAccessAdminPath("/admin", support), true);
    assert.equal(canAccessAdminPath("/admin/support", support), true);
    assert.equal(canAccessAdminPath("/admin/tenants", support), true);
    assert.equal(canAccessAdminPath("/admin/crm", support), false);
    assert.equal(canAccessAdminPath("/admin/invoices", support), false);
  });

  it("keeps superadmin on every admin route", () => {
    assert.equal(canAccessAdminPath("/admin/invoices", superadmin), true);
    assert.equal(canAccessAdminPath("/admin/settings", superadmin), true);
  });
});

describe("crmReplyToAddress", () => {
  it("uses the deal owner so replies reach Callum or the salesperson", () => {
    assert.equal(
      crmReplyToAddress({
        owner: { name: "Callum", email: "callum@hseqnova.co.uk" },
        staff: { name: "Kenneth", email: "kenneth@hseqnova.co.uk" },
      }),
      "Callum <callum@hseqnova.co.uk>",
    );
  });

  it("falls back to the staff member when the deal is unassigned", () => {
    assert.equal(
      crmReplyToAddress({
        owner: null,
        staff: { name: "Callum", email: "callum@hseqnova.co.uk" },
      }),
      "Callum <callum@hseqnova.co.uk>",
    );
  });
});
