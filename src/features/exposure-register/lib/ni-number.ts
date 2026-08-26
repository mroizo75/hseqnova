/**
 * UK National Insurance number (NINO). Stored in employeeBirthNumber.
 * HMRC format: two letters, six digits, one letter (A–D).
 */
const NINO_PATTERN = /^(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/;

export function normalizeNiNumber(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

export function niNumberStatus(value: string): "valid" | "invalid" | "incomplete" {
  const nino = normalizeNiNumber(value);
  if (nino.length === 0) return "incomplete";
  if (nino.length < 9) return "incomplete";
  if (!NINO_PATTERN.test(nino)) return "invalid";
  return "valid";
}

export function isValidNiNumber(value: string): boolean {
  return niNumberStatus(value) === "valid";
}
