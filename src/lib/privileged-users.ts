import { randomInt, randomBytes } from "crypto";

export type PrivilegedRole = "SUPERADMIN" | "SUPPORT";

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+";
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SYMBOLS}`;

const MIN_LENGTH = 12;

function pickRandomChar(source: string): string {
  if (source.length === 0) {
    throw new Error("Character source cannot be empty");
  }

  const index = randomInt(0, source.length);
  return source[index]!;
}

export function generateSecurePassword(length: number = 16): string {
  if (!Number.isInteger(length) || length < MIN_LENGTH) {
    throw new Error(`Passordlengde må være et heltall på minst ${MIN_LENGTH} tegn.`);
  }

  const requiredChars = [
    pickRandomChar(UPPERCASE),
    pickRandomChar(LOWERCASE),
    pickRandomChar(NUMBERS),
    pickRandomChar(SYMBOLS),
  ];

  const remainingLength = length - requiredChars.length;
  const passwordChars = [...requiredChars];

  for (let i = 0; i < remainingLength; i += 1) {
    passwordChars.push(pickRandomChar(ALL_CHARACTERS));
  }

  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j]!, passwordChars[i]!];
  }

  return passwordChars.join("");
}

export function generateBootstrapToken(): string {
  return randomBytes(24).toString("base64url");
}

export function getPrivilegedRoleLabel(role: PrivilegedRole): string {
  return role === "SUPERADMIN" ? "superadmin" : "support";
}

