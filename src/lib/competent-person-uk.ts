/**
 * Competent person — MHSWR 1999 reg.7.
 *
 * Every employer must appoint one or more competent persons to assist with
 * the measures needed to comply with health and safety law (reg.7(1)).
 * Prefer a person in employment where one is available (reg.7(8)).
 * Competence is sufficient training and experience or knowledge and other
 * qualities (reg.7(5)). Formal qualifications are not required by law (HSE).
 *
 * In this product the HMS role is system access (day-to-day HSEQ). The legal
 * appointment is the named person on the organisation chart
 * (hsDutyKey = competent_person). Employees see that name on the written
 * policy (HSWA 1974 s.2(3) Part 2).
 *
 * Official: legislation.gov.uk/uksi/1999/3242/regulation/7
 *           hse.gov.uk/simple-health-safety/gettinghelp/index.htm
 */

export function namedCompetentPersons(
  nodes: Array<{ hsDutyKey?: string | null; name?: string | null }>,
): string[] {
  return nodes
    .filter((node) => node.hsDutyKey === "competent_person" && Boolean(node.name?.trim()))
    .map((node) => node.name!.trim());
}

export function hasNamedCompetentPerson(
  nodes: Array<{ hsDutyKey?: string | null; name?: string | null }>,
): boolean {
  return namedCompetentPersons(nodes).length > 0;
}

/** HSWA s.2(3) organisation lists named people — invite must carry a name. */
export function validateInviteName(
  raw: string | null | undefined,
): { ok: true; name: string } | { ok: false; code: string; message: string } {
  const name = raw?.trim() ?? "";
  if (name.length < 2) {
    return {
      ok: false,
      code: "NAME_REQUIRED",
      message: "A name is required (HSWA 1974 s.2(3) — organisation lists named people).",
    };
  }
  return { ok: true, name };
}
