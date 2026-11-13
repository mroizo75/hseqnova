"use server";

import { sendEmail } from "@/lib/email";
import { deliverSafetyCheck } from "@/lib/safety-check-submit";

export async function submitSafetyCheck(input: unknown) {
  return deliverSafetyCheck(input, sendEmail);
}
