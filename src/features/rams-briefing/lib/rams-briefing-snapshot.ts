export type RamsHazardSnapshot = {
  activity: string;
  hazard: string;
  measures: string;
  riskLevel: number;
};

export function buildRamsBriefingSnapshot(
  hazards: Array<{ activity: string; hazard: string; measures: string; riskLevel: number }>,
  limit = 5,
): RamsHazardSnapshot[] {
  return [...hazards]
    .sort((a, b) => b.riskLevel - a.riskLevel)
    .slice(0, limit)
    .map((hazard) => ({
      activity: hazard.activity,
      hazard: hazard.hazard,
      measures: hazard.measures,
      riskLevel: hazard.riskLevel,
    }));
}

export function parseAttendeeNames(raw: string): string[] {
  const unique: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    const name = part.trim();
    if (!name || unique.includes(name)) continue;
    unique.push(name);
  }
  return unique;
}
