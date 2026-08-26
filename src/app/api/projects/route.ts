import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { AuditLog } from "@/lib/audit-log";
import {
  insertProject,
  loadProjectsForTenant,
  membershipExists,
  replaceDutyHoldersForProject,
  syncCdmFreeTextFromDutyHolders,
} from "@/server/queries/projects.queries";
import {
  cdmDutyHolderSchema,
  clientNameFromDutyHolders,
  validateDutyHolders,
} from "@/features/projects/lib/cdm-duty-holders";

const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional(),
  orderNumber: z.string().optional(),
  clientName: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("PLANNING"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectManagerId: z.string().optional(),
  dutyHolders: z.array(cdmDutyHolderSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No organisation selected" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const projects = await loadProjectsForTenant(tenantId, { status: status ?? undefined });

    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json(
      { code: error?.code ?? "PROJECT_LIST_FAILED", message: error?.message ?? "Could not load projects", error: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const tenantId = session.user.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No organisation selected" }, { status: 400 });

    const body = await request.json();
    const validated = createProjectSchema.parse(body);
    const dutyHolders = validateDutyHolders(validated.dutyHolders ?? []);
    if (!dutyHolders.ok) {
      return NextResponse.json({ error: dutyHolders.message }, { status: 400 });
    }
    const clientName = clientNameFromDutyHolders(dutyHolders.holders) ?? validated.clientName ?? null;
    let validatedProjectManagerId: string | null = null;
    if (validated.projectManagerId) {
      const managerExists = await membershipExists(validated.projectManagerId, tenantId);
      if (!managerExists) {
        return NextResponse.json({ error: "Site manager is not in this organisation" }, { status: 400 });
      }
      validatedProjectManagerId = validated.projectManagerId;
    }

    const project = await insertProject({
      tenantId,
      name: validated.name,
      code: validated.code || null,
      orderNumber: validated.orderNumber || null,
      clientName,
      location: validated.location || null,
      description: validated.description || null,
      status: validated.status,
      startDate: validated.startDate ? new Date(validated.startDate) : null,
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      projectManagerId: validatedProjectManagerId,
      createdById: session.user.id,
    });

    const savedHolders = await replaceDutyHoldersForProject({
      tenantId,
      projectId: project.id,
      holders: dutyHolders.holders,
    });
    await syncCdmFreeTextFromDutyHolders(project.id, tenantId, savedHolders);

    await AuditLog.log(tenantId, session.user.id, "PROJECT_CREATED", "Project", project.id, {
      name: project.name,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.issues ?? error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { code: error?.code ?? "PROJECT_CREATE_FAILED", message: error?.message ?? "Could not create the project", error: error?.message },
      { status: 500 },
    );
  }
}
