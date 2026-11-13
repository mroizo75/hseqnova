import { z } from "zod";
import { safetyCheckEmailHtml, safetyCheckSubject, type SafetyCheckLead } from "@/lib/safety-check-email";
import {
  assessSafetyCheck,
  SAFETY_CHECK_RECIPIENT,
  type SafetyCheckResult,
} from "@/lib/safety-check";

const submissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Enter your name." })
    .max(120)
    .refine((value) => !/[\r\n]/.test(value), { message: "Enter your name." }),
  company: z
    .string()
    .trim()
    .min(2, { message: "Enter your company." })
    .max(160)
    .refine((value) => !/[\r\n]/.test(value), { message: "Enter your company." }),
  email: z
    .string()
    .trim()
    .email({ message: "Enter a valid email address." })
    .max(200)
    .refine((value) => !/[\r\n]/.test(value), { message: "Enter a valid email address." }),
  consent: z.literal(true, {
    message: "Tick the box to confirm we may contact you about this check.",
  }),
  industryId: z.string().trim().min(1),
  answerIds: z.array(z.string().trim().min(1)).length(6),
  website: z.string().optional(),
});

export type SafetyCheckSubmissionError = {
  code: string;
  message: string;
};

export type SafetyCheckSend = (params: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) => Promise<unknown>;

type SafetyCheckPreparation =
  | { status: "invalid"; error: SafetyCheckSubmissionError }
  | { status: "honeypot" }
  | { status: "ready"; lead: SafetyCheckLead; result: SafetyCheckResult };

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export function prepareSafetyCheck(input: unknown): SafetyCheckPreparation {
  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) {
    const consentIssue = parsed.error.issues.find((issue) => issue.path[0] === "consent");
    return {
      status: "invalid",
      error: {
        code: consentIssue ? "CONSENT_REQUIRED" : "INVALID_SUBMISSION",
        message: firstIssue(parsed.error),
      },
    };
  }

  if (parsed.data.website?.trim()) {
    return { status: "honeypot" };
  }

  const result = assessSafetyCheck(parsed.data.industryId, parsed.data.answerIds);
  if (!result) {
    return {
      status: "invalid",
      error: {
        code: "INVALID_ASSESSMENT",
        message: "Answer every question before sending your results.",
      },
    };
  }

  return {
    status: "ready",
    lead: {
      name: parsed.data.name,
      company: parsed.data.company,
      email: parsed.data.email,
    },
    result,
  };
}

function publicSendError(error: unknown): SafetyCheckSubmissionError {
  const code =
    error && typeof error === "object" && "code" in error ? String(error.code) : "SAFETY_CHECK_FAILED";
  return {
    code,
    message: `We could not send your results just now. Email ${SAFETY_CHECK_RECIPIENT} and we will pick it up.`,
  };
}

export async function deliverSafetyCheck(
  input: unknown,
  send: SafetyCheckSend,
): Promise<{ success: true } | { success: false; error: SafetyCheckSubmissionError }> {
  const prepared = prepareSafetyCheck(input);
  if (prepared.status === "invalid") return { success: false, error: prepared.error };
  if (prepared.status === "honeypot") return { success: true };

  try {
    await send({
      to: SAFETY_CHECK_RECIPIENT,
      replyTo: prepared.lead.email,
      subject: safetyCheckSubject(prepared.lead, prepared.result),
      html: safetyCheckEmailHtml(prepared.lead, prepared.result),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: publicSendError(error) };
  }
}
