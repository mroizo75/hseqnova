import test from "node:test";
import assert from "node:assert/strict";
import {
  getIncidentTypeGroup,
  getIncidentTypeGroups,
  getIncidentTypeLabel,
  getIncidentTypesForGroup,
  getMainCategory,
  getMainCategoryLabel,
  getSingleTypeForGroup,
} from "../src/features/incidents/schemas/incident.schema";

test("UK accident book always uses four groups regardless of the legacy RUH flag", () => {
  assert.deepEqual(
    getIncidentTypeGroups(true).map((definition) => definition.group),
    ["HMS", "KVALITET", "MILJO", "CUSTOMER"]
  );
  assert.deepEqual(
    getIncidentTypeGroups(false).map((definition) => definition.group),
    ["HMS", "KVALITET", "MILJO", "CUSTOMER"]
  );
});

test("accident book group lists RIDDOR types first", () => {
  const types = getIncidentTypesForGroup("HMS");
  assert.deepEqual([...types], ["ULYKKE", "NESTEN", "FARLIG_SITUASJON", "YRKESSYKDOM", "HMS"]);
});

test("single-type groups skip the second type picker", () => {
  assert.equal(getSingleTypeForGroup("KVALITET"), "KVALITET");
  assert.equal(getSingleTypeForGroup("MILJO"), "MILJO");
  assert.equal(getSingleTypeForGroup("CUSTOMER"), "CUSTOMER");
  assert.equal(getSingleTypeForGroup("HMS"), null);
});

test("stored types map back to the UK groups", () => {
  assert.equal(getIncidentTypeGroup("ULYKKE"), "HMS");
  assert.equal(getIncidentTypeGroup("KVALITET"), "KVALITET");
  assert.equal(getIncidentTypeGroup("AVVIK"), "HMS");
  assert.equal(getIncidentTypeGroup("SKADE"), "HMS");
  assert.equal(getIncidentTypeGroup(""), null);
});

test("main category labels are accident book vs other record", () => {
  assert.equal(getMainCategory("ULYKKE"), "RUH");
  assert.equal(getMainCategoryLabel("RUH"), "Accident book");
  assert.equal(getMainCategory("KVALITET"), "AVVIK");
  assert.equal(getMainCategoryLabel("AVVIK"), "Other record");
});

test("dangerous occurrence uses the UK label", () => {
  assert.equal(
    getIncidentTypeLabel("FARLIG_SITUASJON"),
    "Unsafe condition / dangerous occurrence"
  );
});
