import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z, ZodSchema } from "zod";
import { getAdminDb } from "@/lib/supabase/admin";
import { getAppUser } from "@/lib/membership";

export type ActionContext = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    isSuperAdmin?: boolean;
    tenantId?: string | null;
  };
  session: any;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function authAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: (input: TInput, ctx: ActionContext) => Promise<TOutput>
) {
  return async (rawInput: unknown): Promise<ActionResult<TOutput>> => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return { success: false, error: "Ikke autentisert" };
      }

      const input = schema.parse(rawInput);

      const ctx: ActionContext = {
        user: session.user,
        session,
      };

      const data = await handler(input, ctx);

      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: "Ugyldig data" };
      }
      console.error("Server action error:", error);
      return { success: false, error: "Noe gikk galt" };
    }
  };
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email || !session.user.tenantId) {
    return null;
  }

  const user = await getAppUser({ email: session.user.email });
  if (!user) {
    return null;
  }

  const { data: membership } = await getAdminDb()
    .from("UserTenant")
    .select("tenantId, role")
    .eq("userId", user.id)
    .eq("tenantId", session.user.tenantId)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("*")
    .eq("id", membership.tenantId)
    .maybeSingle();

  if (!tenant) {
    return null;
  }

  return {
    ...user,
    tenants: [
      {
        tenantId: membership.tenantId,
        role: membership.role,
        tenant,
      },
    ],
  };
}

