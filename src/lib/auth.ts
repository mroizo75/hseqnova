import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import {
  countOverdueInvoices,
  getAuthMembership,
  getAuthUserByEmail,
  getAuthUserById,
  recordFailedLogin,
  resetFailedLogins,
} from "@/lib/auth-db";
import { SESSION_TOKEN_COOKIE_NAME } from "@/lib/auth-cookie";
import { shouldRefreshMembership } from "@/lib/auth-session";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

const azureAdClientId = process.env.AZURE_AD_CLIENT_ID;
const azureAdClientSecret = process.env.AZURE_AD_CLIENT_SECRET;
const isAzureAdConfigured = Boolean(azureAdClientId && azureAdClientSecret);

export const authOptions: NextAuthOptions = {
  providers: [
    // Microsoft/Office 365 SSO.
    // Registreres kun når appen faktisk har credentials, slik at vi ikke sender
    // en tom client_id til Microsoft og får en uforståelig AADSTS-feil tilbake.
    ...(isAzureAdConfigured
      ? [
          AzureADProvider({
            clientId: azureAdClientId!,
            clientSecret: azureAdClientSecret!,
            tenantId: process.env.AZURE_AD_TENANT_ID || "common",
            // Tenant-tilknytning og brukeropprettelse skjer i signIn-callbacken under.
            // Uten dette avviser PrismaAdapter hver førstegangsinnlogging med
            // OAuthAccountNotLinked fordi brukeren allerede er opprettet der.
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                scope: "openid profile email User.Read",
                prompt: "select_account", // Tvinger bruker til å velge konto
              },
            },
          }),
        ]
      : []),
    // Traditional credentials login
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Ugyldig pålogging");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await getAuthUserByEmail(normalizedEmail);

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const MAX_ATTEMPTS = 5;
        const LOCKOUT_DURATION = 15 * 60 * 1000;
        const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil) : null;

        if (lockedUntil && lockedUntil > new Date()) {
          const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(
            `This account is locked. Try again in ${minutesLeft} minutes.`,
          );
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const currentAttempts = user.failedLoginAttempts || 0;
          const newFailedAttempts = currentAttempts + 1;
          const shouldLock = newFailedAttempts >= MAX_ATTEMPTS;
          await recordFailedLogin(
            user.id,
            newFailedAttempts,
            shouldLock ? new Date(Date.now() + LOCKOUT_DURATION) : null,
          );

          if (shouldLock) {
            throw new Error("Too many failed attempts. The account is locked for 15 minutes.");
          }

          const attemptsLeft = MAX_ATTEMPTS - newFailedAttempts;
          throw new Error(`Invalid email or password. ${attemptsLeft} attempts remaining.`);
        }

        if ((user.failedLoginAttempts || 0) > 0 || lockedUntil) {
          await resetFailedLogins(user.id);
        }

        if (!user.isSuperAdmin && !user.isSupport && user.tenants.length === 0) {
          throw new Error("This account is not linked to a company. Contact support.");
        }

        if (!user.isSuperAdmin && !user.isSupport && user.tenants.length > 0) {
          const preferredTenant = user.lastTenantId
            ? user.tenants.find((membership) => membership.tenantId === user.lastTenantId)
            : null;
          const activeTenant =
            user.tenants.find(
              (membership) =>
                membership.tenant?.status === "ACTIVE" || membership.tenant?.status === "TRIAL",
            ) ?? null;
          const tenant =
            preferredTenant?.tenant ?? activeTenant?.tenant ?? user.tenants.at(0)?.tenant ?? null;
          if (!tenant) {
            throw new Error("This account has no valid company membership.");
          }

          if (tenant.status === "SUSPENDED") {
            const overdue = await countOverdueInvoices(tenant.id);
            throw new Error(
              overdue > 0
                ? "This company is suspended because of an overdue invoice. Contact hello@hseqnova.co.uk."
                : "This company is suspended. Contact hello@hseqnova.co.uk.",
            );
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: SESSION_TOKEN_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider && account.provider !== "credentials") {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        try {
          const dbUser = await getAuthUserById(user.id);
          if (dbUser) {
            token.isSuperAdmin = dbUser.isSuperAdmin;
            token.isSupport = dbUser.isSupport || false;
            token.hasMultipleTenants = dbUser.tenants.length > 1;
            token.preferredLocale = dbUser.preferredLocale || "en-GB";

            const eligibleTenants = dbUser.tenants.filter(
              (membership) =>
                membership.tenant?.status === "ACTIVE" || membership.tenant?.status === "TRIAL",
            );
            const selectedTenant =
              (dbUser.lastTenantId
                ? eligibleTenants.find((membership) => membership.tenantId === dbUser.lastTenantId)
                : null) ??
              eligibleTenants[0] ??
              dbUser.tenants.at(0) ??
              null;

            token.tenantId = selectedTenant?.tenantId || null;
            token.role = (selectedTenant?.role as Role | undefined) || undefined;
            token.tenantName = selectedTenant?.tenant?.name || null;
            token.isTavleOnly = selectedTenant?.tenant?.isTavleOnly ?? false;
            token.roleUpdatedAt = selectedTenant?.updatedAt
              ? new Date(selectedTenant.updatedAt).getTime()
              : null;
          }
        } catch {
          // Keep a signed-in JWT even if membership lookup is briefly unreachable.
        }
        token.membershipCheckedAt = Date.now();
      }

      if (trigger === "update" && session?.tenantId) {
        token.tenantId = session.tenantId;

        try {
          const dbUser = await getAuthUserById(token.id as string);
          const selectedMembership = dbUser?.tenants.find(
            (membership) => membership.tenantId === session.tenantId,
          );
          if (selectedMembership) {
            token.role = selectedMembership.role as Role;
            token.tenantName = selectedMembership.tenant?.name ?? null;
            token.roleUpdatedAt = new Date(selectedMembership.updatedAt).getTime();
            token.isTavleOnly = selectedMembership.tenant?.isTavleOnly ?? false;
          }
          token.membershipCheckedAt = Date.now();
        } catch {
          token.membershipCheckedAt = Date.now();
        }

        return token;
      }

      if (!user && token.id && token.tenantId && shouldRefreshMembership(token.membershipCheckedAt)) {
        try {
          const membership = await getAuthMembership(token.id as string, token.tenantId as string);
          if (membership) {
            const dbUpdatedAt = new Date(membership.updatedAt).getTime();
            const tokenUpdatedAt = token.roleUpdatedAt as number | null;
            if (tokenUpdatedAt === null || dbUpdatedAt > tokenUpdatedAt) {
              token.role = membership.role as Role;
              token.roleUpdatedAt = dbUpdatedAt;
            }
          }
        } catch {
          // Keep the existing JWT if Supabase is briefly unreachable.
        }
        token.membershipCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.isSupport = token.isSupport as boolean;
        session.user.tenantId = token.tenantId as string | null;
        session.user.role = token.role as any;
        session.user.tenantName = token.tenantName as string | null;
        session.user.hasMultipleTenants = token.hasMultipleTenants as boolean;
        session.user.preferredLocale = (token.preferredLocale as string | undefined) ?? "en-GB";
        session.user.isTavleOnly = (token.isTavleOnly as boolean | undefined) ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Logg SSO innlogginger
      if (account?.provider !== "credentials") {
        console.log(`SSO login: ${user.email} via ${account.provider}`);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

