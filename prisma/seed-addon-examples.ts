/**
 * Seed UK example records for the Audits and Environment add-on packs.
 * Uses Supabase (service role). Idempotent by example title.
 *
 * Usage: npm run seed:addons
 */
import "dotenv/config";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";

const MODULE_KEYS = ["audits", "environment"] as const;

const AUDIT_TITLES = {
  warehouse: "ISO 45001 internal audit — warehouse and yard",
  waste: "ISO 14001 internal audit — waste and duty of care",
  supplier: "Supplier audit — licensed waste contractor",
} as const;

const ASPECT_TITLES = {
  energy: "Electricity use on the production shift",
  waste: "Hazardous waste from plant maintenance",
  water: "Yard surface-water runoff",
} as const;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function nowIso(): string {
  return new Date().toISOString();
}

function fail(code: string, message: string): never {
  throw { code, message };
}

type TenantRow = { id: string; name: string; slug: string };

async function loadTenants(): Promise<TenantRow[]> {
  const slug = process.env.SEED_TENANT_SLUG?.trim();
  let query = getAdminDb().from("Tenant").select("id, name, slug");
  if (slug) {
    query = query.eq("slug", slug);
  }
  const { data, error } = await query.order("createdAt", { ascending: true });
  if (error) {
    fail("TENANT_LOOKUP_FAILED", error.message);
  }
  return (data ?? []) as TenantRow[];
}

async function loadTenantUserIds(tenantId: string): Promise<string[]> {
  const { data, error } = await getAdminDb()
    .from("UserTenant")
    .select("userId")
    .eq("tenantId", tenantId);
  if (error) {
    fail("USER_LOOKUP_FAILED", error.message);
  }
  return ((data ?? []) as Array<{ userId: string }>).map((row) => row.userId);
}

async function enableAddonModules(tenantId: string): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();
  for (const moduleKey of MODULE_KEYS) {
    const { data: existing, error: lookupError } = await db
      .from("TenantModule")
      .select("id")
      .eq("tenantId", tenantId)
      .eq("moduleKey", moduleKey)
      .maybeSingle();
    if (lookupError) {
      fail("MODULE_LOOKUP_FAILED", lookupError.message);
    }
    if (existing?.id) {
      const { error } = await db
        .from("TenantModule")
        .update({ status: "ACTIVE", endsAt: null, updatedAt: now })
        .eq("id", existing.id);
      if (error) {
        fail("MODULE_UPDATE_FAILED", error.message);
      }
      continue;
    }
    const { error } = await db.from("TenantModule").insert({
      id: createId(),
      tenantId,
      moduleKey,
      status: "ACTIVE",
      startsAt: now,
      endsAt: null,
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("MODULE_CREATE_FAILED", error.message);
    }
  }
}

async function findByTitle(
  table: "Audit" | "EnvironmentalAspect",
  tenantId: string,
  title: string
): Promise<string | null> {
  const { data, error } = await getAdminDb()
    .from(table)
    .select("id")
    .eq("tenantId", tenantId)
    .eq("title", title)
    .maybeSingle();
  if (error) {
    fail(`${table.toUpperCase()}_LOOKUP_FAILED`, error.message);
  }
  return data?.id ? String(data.id) : null;
}

async function seedAudits(tenantId: string, ownerId: string, deputyId: string): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();

  if (!(await findByTitle("Audit", tenantId, AUDIT_TITLES.warehouse))) {
    const auditId = createId();
    const { error } = await db.from("Audit").insert({
      id: auditId,
      tenantId,
      title: AUDIT_TITLES.warehouse,
      auditType: "INTERNAL",
      scope: "Warehouse, yard and goods-in. People, plant, traffic and work at height.",
      criteria: "ISO 45001:2018 clauses 6–10; Work at Height Regulations 2005; MHSWR 1999",
      leadAuditorId: ownerId,
      teamMemberIds: deputyId !== ownerId ? JSON.stringify([deputyId]) : null,
      scheduledDate: daysAgo(18).toISOString(),
      completedAt: daysAgo(14).toISOString(),
      area: "Health and safety",
      department: "Warehouse",
      status: "COMPLETED",
      summary:
        "Internal audit of the warehouse and yard. One minor nonconformity and one observation recorded.",
      conclusion:
        "The OH&S system is being used. Close the rescue-plan drill before the next management review.",
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("AUDIT_CREATE_FAILED", error.message);
    }

    const { error: findingError } = await db.from("AuditFinding").insert([
      {
        id: createId(),
        auditId,
        findingType: "MINOR_NC",
        clause: "8.1",
        description: "Work-at-height rescue plan has not been practised this year.",
        evidence:
          "Interview with the warehouse supervisor. Last recorded rescue drill was more than 12 months ago.",
        requirement:
          "ISO 45001:2018 cl. 8.1 and the Work at Height Regulations 2005 require planned emergency arrangements for work at height.",
        responsibleId: deputyId,
        dueDate: daysFromNow(21).toISOString(),
        status: "OPEN",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        auditId,
        findingType: "OBSERVATION",
        clause: "7.4",
        description: "Toolbox talks for agency labour are not always recorded.",
        evidence: "Three agency workers on goods-in could not show a recorded briefing for this week.",
        requirement: "ISO 45001:2018 cl. 7.4 — communication of OH&S information to workers.",
        responsibleId: ownerId,
        dueDate: daysFromNow(30).toISOString(),
        status: "OPEN",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        auditId,
        findingType: "STRENGTH",
        clause: "10.2",
        description: "Near-miss cards from the yard are reviewed at the weekly briefing.",
        evidence: "Board in the mess room showed 11 near-miss reports in the last quarter, all acknowledged.",
        requirement: "ISO 45001:2018 cl. 10.2 — incident, nonconformity and corrective action.",
        responsibleId: ownerId,
        status: "VERIFIED",
        closedAt: daysAgo(14).toISOString(),
        verifiedById: ownerId,
        verifiedAt: daysAgo(14).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
    ]);
    if (findingError) {
      fail("AUDIT_FINDING_CREATE_FAILED", findingError.message);
    }
    console.log("  · audit:", AUDIT_TITLES.warehouse);
  }

  if (!(await findByTitle("Audit", tenantId, AUDIT_TITLES.waste))) {
    const auditId = createId();
    const { error } = await db.from("Audit").insert({
      id: auditId,
      tenantId,
      title: AUDIT_TITLES.waste,
      auditType: "INTERNAL",
      scope: "Waste storage, transfer notes and contractor licences on the yard.",
      criteria: "ISO 14001:2015 cl. 8.1; Environmental Protection Act 1990 s.34",
      leadAuditorId: ownerId,
      teamMemberIds: null,
      scheduledDate: daysAgo(3).toISOString(),
      area: "Environment",
      department: "Maintenance",
      status: "IN_PROGRESS",
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("AUDIT_CREATE_FAILED", error.message);
    }

    const { error: findingError } = await db.from("AuditFinding").insert({
      id: createId(),
      auditId,
      findingType: "MINOR_NC",
      clause: "8.1",
      description: "Two waste transfer notes from last month are missing the SIC code.",
      evidence: "Sample of six notes in the yard office. Two from 12 July had no SIC code.",
      requirement:
        "Duty of care under the Environmental Protection Act 1990 s.34 and the Waste (England and Wales) Regulations 2011.",
      responsibleId: deputyId,
      dueDate: daysFromNow(14).toISOString(),
      status: "IN_PROGRESS",
      createdAt: now,
      updatedAt: now,
    });
    if (findingError) {
      fail("AUDIT_FINDING_CREATE_FAILED", findingError.message);
    }
    console.log("  · audit:", AUDIT_TITLES.waste);
  }

  if (!(await findByTitle("Audit", tenantId, AUDIT_TITLES.supplier))) {
    const { error } = await db.from("Audit").insert({
      id: createId(),
      tenantId,
      title: AUDIT_TITLES.supplier,
      auditType: "SUPPLIER",
      scope: "Licence, insurance and duty-of-care paperwork for the hazardous-waste contractor.",
      criteria: "Environmental Protection Act 1990 s.34; Environment Agency waste carrier licence",
      leadAuditorId: ownerId,
      teamMemberIds: null,
      scheduledDate: daysFromNow(21).toISOString(),
      area: "Environment",
      department: "Procurement",
      status: "PLANNED",
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("AUDIT_CREATE_FAILED", error.message);
    }
    console.log("  · audit:", AUDIT_TITLES.supplier);
  }
}

async function seedEnvironment(tenantId: string, ownerId: string, deputyId: string): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();

  const energyId = await findByTitle("EnvironmentalAspect", tenantId, ASPECT_TITLES.energy);
  if (!energyId) {
    const aspectId = createId();
    const measuredAt = daysAgo(6);
    const { error } = await db.from("EnvironmentalAspect").insert({
      id: aspectId,
      tenantId,
      title: ASPECT_TITLES.energy,
      description: "Electricity for plant, lighting and space heating on the late shift.",
      process: "Production",
      location: "Main workshop",
      category: "ENERGY",
      impactType: "NEGATIVE",
      severity: 4,
      likelihood: 4,
      significanceScore: 16,
      legalRequirement: "Optional ISO 14001:2015 — energy use is not an HSWA duty.",
      controlMeasures: "Shutdown checklist at end of shift; LED lighting; winter set-back on heaters.",
      monitoringMethod: "Half-hourly meter",
      monitoringFrequency: "MONTHLY",
      ownerId,
      status: "ACTIVE",
      nextReviewDate: daysFromNow(60).toISOString(),
      lastMeasurementDate: measuredAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("ENVIRONMENT_CREATE_FAILED", error.message);
    }
    const { error: measurementError } = await db.from("EnvironmentalMeasurement").insert({
      id: createId(),
      tenantId,
      aspectId,
      parameter: "Electricity use",
      unit: "kWh",
      method: "Half-hourly meter",
      limitValue: 22000,
      targetValue: 18000,
      measuredValue: 19420,
      measurementDate: measuredAt.toISOString(),
      status: "WARNING",
      notes: "Two extra Saturday shifts for a rush order.",
      responsibleId: deputyId,
      createdAt: now,
      updatedAt: now,
    });
    if (measurementError) {
      fail("ENVIRONMENT_MEASUREMENT_CREATE_FAILED", measurementError.message);
    }
    console.log("  · aspect:", ASPECT_TITLES.energy);
  }

  const wasteId = await findByTitle("EnvironmentalAspect", tenantId, ASPECT_TITLES.waste);
  if (!wasteId) {
    const aspectId = createId();
    const measuredAt = daysAgo(20);
    const { error } = await db.from("EnvironmentalAspect").insert({
      id: aspectId,
      tenantId,
      title: ASPECT_TITLES.waste,
      description: "Waste oil, rags and solvent from servicing the plant.",
      process: "Maintenance",
      location: "Workshop store",
      category: "WASTE",
      impactType: "NEGATIVE",
      severity: 5,
      likelihood: 3,
      significanceScore: 15,
      legalRequirement: "Environmental Protection Act 1990 s.34 — duty of care for waste.",
      controlMeasures: "Closed, labelled drums; licensed carrier; waste transfer notes kept for 2 years.",
      monitoringMethod: "Transfer notes and drum inventory",
      monitoringFrequency: "QUARTERLY",
      ownerId,
      status: "MONITORED",
      nextReviewDate: daysFromNow(90).toISOString(),
      lastMeasurementDate: measuredAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("ENVIRONMENT_CREATE_FAILED", error.message);
    }
    const { error: measurementError } = await db.from("EnvironmentalMeasurement").insert({
      id: createId(),
      tenantId,
      aspectId,
      parameter: "Hazardous waste collected",
      unit: "kg",
      method: "Carrier consignment note",
      limitValue: 400,
      targetValue: 250,
      measuredValue: 210,
      measurementDate: measuredAt.toISOString(),
      status: "COMPLIANT",
      notes: "Collected by the licensed carrier. Transfer note filed.",
      responsibleId: ownerId,
      createdAt: now,
      updatedAt: now,
    });
    if (measurementError) {
      fail("ENVIRONMENT_MEASUREMENT_CREATE_FAILED", measurementError.message);
    }
    console.log("  · aspect:", ASPECT_TITLES.waste);
  }

  const waterId = await findByTitle("EnvironmentalAspect", tenantId, ASPECT_TITLES.water);
  if (!waterId) {
    const aspectId = createId();
    const measuredAt = daysAgo(12);
    const { error } = await db.from("EnvironmentalAspect").insert({
      id: aspectId,
      tenantId,
      title: ASPECT_TITLES.water,
      description: "Oil and silt from the yard that can reach the surface-water drain.",
      process: "Yard operations",
      location: "External yard",
      category: "WATER",
      impactType: "NEGATIVE",
      severity: 4,
      likelihood: 3,
      significanceScore: 12,
      legalRequirement: "Environmental Permitting (England and Wales) Regulations 2016 — unauthorised discharge.",
      controlMeasures: "Bunded drums, spill kits at the gate, quarterly interceptor check.",
      monitoringMethod: "Interceptor inspection",
      monitoringFrequency: "QUARTERLY",
      ownerId,
      status: "ACTIVE",
      nextReviewDate: daysFromNow(75).toISOString(),
      lastMeasurementDate: measuredAt.toISOString(),
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      fail("ENVIRONMENT_CREATE_FAILED", error.message);
    }
    const { error: measurementError } = await db.from("EnvironmentalMeasurement").insert({
      id: createId(),
      tenantId,
      aspectId,
      parameter: "Oil interceptor oil layer",
      unit: "mm",
      method: "Dip test",
      limitValue: 80,
      targetValue: 40,
      measuredValue: 28,
      measurementDate: measuredAt.toISOString(),
      status: "COMPLIANT",
      notes: "Layer below the empty-out trigger. Next check booked.",
      responsibleId: deputyId,
      createdAt: now,
      updatedAt: now,
    });
    if (measurementError) {
      fail("ENVIRONMENT_MEASUREMENT_CREATE_FAILED", measurementError.message);
    }
    console.log("  · aspect:", ASPECT_TITLES.water);
  }
}

async function seedTenant(tenant: TenantRow): Promise<void> {
  const userIds = await loadTenantUserIds(tenant.id);
  if (userIds.length === 0) {
    console.log(`Skip ${tenant.name} (${tenant.slug}) — no users`);
    return;
  }
  const ownerId = userIds[0];
  const deputyId = userIds[1] ?? userIds[0];

  console.log(`Seeding ${tenant.name} (${tenant.slug})`);
  await enableAddonModules(tenant.id);
  await seedAudits(tenant.id, ownerId, deputyId);
  await seedEnvironment(tenant.id, ownerId, deputyId);
}

async function main(): Promise<void> {
  const tenants = await loadTenants();
  if (tenants.length === 0) {
    fail("NO_TENANT", "No tenant found. Set SEED_TENANT_SLUG if you need a specific company.");
  }
  for (const tenant of tenants) {
    await seedTenant(tenant);
  }
  console.log("Done.");
}

main().catch((error) => {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : String(error);
  console.error("Seed failed:", message);
  process.exitCode = 1;
});
