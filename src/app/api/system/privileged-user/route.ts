import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendPrivilegedAccessEmail } from "@/lib/email-service";
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  validateRequestBody,
} from "@/lib/validations/api";
import { generateSecurePassword } from "@/lib/privileged-users";

const privilegedUserSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  name: z.string().min(2, "Navn må bestå av minst 2 tegn"),
  password: z.string().min(12).max(128).optional(),
  role: z.enum(["SUPERADMIN", "SUPPORT"]),
});

function extractBootstrapToken(request: NextRequest) {
  const directHeader =
    request.headers.get("x-bootstrap-token") || request.headers.get("x-static-access-token");

  if (directHeader) {
    return directHeader.trim();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export async function POST(request: NextRequest) {
  const configuredToken = process.env.SYSTEM_BOOTSTRAP_TOKEN;

  if (!configuredToken) {
    return createErrorResponse(
      ErrorCodes.SERVICE_UNAVAILABLE,
      "Bootstrap-token er ikke konfigurert på serveren.",
      503
    );
  }

  const providedToken = extractBootstrapToken(request);
  if (!providedToken || providedToken !== configuredToken) {
    return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Ugyldig bootstrap-token", 401);
  }

  const validation = await validateRequestBody(request, privilegedUserSchema);
  if ("response" in validation) {
    return validation.response;
  }

  const { email, name, password, role } = validation.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return createErrorResponse(ErrorCodes.ALREADY_EXISTS, "Bruker finnes allerede", 409);
  }

  const plainPassword = password ?? generateSecurePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      isSuperAdmin: role === "SUPERADMIN",
      isSupport: role === "SUPPORT",
      emailVerified: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  try {
    await sendPrivilegedAccessEmail({
      to: user.email,
      name: user.name ?? user.email,
      role,
      tempPassword: plainPassword,
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } });
    return createErrorResponse(
      ErrorCodes.EMAIL_SEND_FAILED,
      "Kunne ikke sende bekreftelsesepost. Opprettelsen ble rullet tilbake.",
      502,
      error instanceof Error ? error.message : undefined
    );
  }

  return createSuccessResponse(
    {
      id: user.id,
      email: user.email,
      role,
      tempPassword: plainPassword,
    },
    `Privilegert bruker ${user.email} opprettet`
  );
}

