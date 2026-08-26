import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { getAuthMembership } from "@/lib/auth-db";
import { resolveEffectivePermissions } from "@/lib/server-authorization";
import { loadTrainingById } from "@/server/queries/training.queries";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getAuthMembership(session.user.id, session.user.tenantId);
    if (!membership) {
      return NextResponse.json({ error: "No organisation access" }, { status: 403 });
    }

    const permissions = await resolveEffectivePermissions(
      session.user.tenantId,
      membership.role as Role,
    );
    if (!permissions.canReadOwnTraining && !permissions.canReadAllTraining) {
      return NextResponse.json({ error: "No access" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id || id.trim().length === 0) {
      return NextResponse.json({ error: "Training id is required" }, { status: 400 });
    }

    const training = await loadTrainingById({
      id: id.trim(),
      tenantId: session.user.tenantId,
      userId: permissions.canReadAllTraining ? undefined : session.user.id,
    });

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    return NextResponse.json({ training }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not load training" }, { status: 500 });
  }
}
