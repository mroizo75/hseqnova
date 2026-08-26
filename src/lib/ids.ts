import { randomBytes } from "node:crypto";

export function createId(): string {
  return `c${randomBytes(12).toString("hex")}`.slice(0, 25);
}
