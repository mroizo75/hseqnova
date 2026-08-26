import { NextRequest, NextResponse } from "next/server";
import { getRequiredTenantContext } from "@/lib/tenant-context";
import { getRosterRetentionUntil } from "@/lib/construction-compliance-rules";
import { getStorage } from "@/lib/storage";
import { z } from "zod";
import {
  deleteProjectRecord,
  loadProjectAttachments,
  loadProjectById,
  loadProjectDetail,
  loadRosterRetentionSummary,
  membershipExists,
  replaceDutyHoldersForProject,
  syncCdmFreeTextFromDutyHolders,
  updateProjectRecord,
} from "@/server/queries/projects.queries";
import {
  cdmDutyHolderSchema,
  clientNameFromDutyHolders,
  validateDutyHolders,
} from "@/features/projects/lib/cdm-duty-holders";

const updateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  code: z.string().optional().nullable(),
  orderNumber: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  projectManagerId: z.string().optional().nullable(),
  dutyHolders: z.array(cdmDutyHolderSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;

    const project = await loadProjectDetail(id, tenantId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json(
      { code: error?.code ?? "PROJECT_LOOKUP_FAILED", message: error?.message ?? "Could not load the project", error: error?.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const existing = await loadProjectById(id, tenantId);
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const dutyHolders = validated.dutyHolders
      ? validateDutyHolders(validated.dutyHolders)
      : null;
    if (dutyHolders && !dutyHolders.ok) {
      return NextResponse.json({ error: dutyHolders.message }, { status: 400 });
    }
    const clientName = dutyHolders
      ? clientNameFromDutyHolders(dutyHolders.holders)
      : validated.clientName;
    let validatedProjectManagerId: string | null | undefined = undefined;
    if (validated.projectManagerId !== undefined) {
      if (validated.projectManagerId === null) {
        validatedProjectManagerId = null;
      } else {
        const managerExists = await membershipExists(validated.projectManagerId, tenantId);
        if (!managerExists) {
          return NextResponse.json({ error: "Site manager is not in this organisation" }, { status: 400 });
        }
        validatedProjectManagerId = validated.projectManagerId;
      }
    }

    const project = await updateProjectRecord(id, tenantId, {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.code !== undefined && { code: validated.code }),
      ...(validated.orderNumber !== undefined && { orderNumber: validated.orderNumber }),
      ...(clientName !== undefined && { clientName }),
      ...(validated.location !== undefined && { location: validated.location }),
      ...(validated.description !== undefined && { description: validated.description }),
      ...(validated.status !== undefined && { status: validated.status }),
      ...(validated.startDate !== undefined && {
        startDate: validated.startDate ? new Date(validated.startDate) : null,
      }),
      ...(validated.endDate !== undefined && {
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      }),
      ...(validatedProjectManagerId !== undefined && {
        projectManagerId: validatedProjectManagerId,
      }),
    });

    if (dutyHolders) {
      const savedHolders = await replaceDutyHoldersForProject({
        tenantId,
        projectId: id,
        holders: dutyHolders.holders,
      });
      await syncCdmFreeTextFromDutyHolders(id, tenantId, savedHolders);
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    return NextResponse.json(
      { code: error?.code ?? "PROJECT_UPDATE_FAILED", message: error?.message ?? "Could not update the project", error: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getRequiredTenantContext();
    const { id } = await params;

    const existing = await loadProjectById(id, tenantId);
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const rosterSummary = await loadRosterRetentionSummary(id, tenantId);

    if (rosterSummary.total > 0) {
      if (rosterSummary.active > 0) {
        return NextResponse.json(
          {
            error:
              "This project cannot be deleted while the site register has active workers. Close those entries first.",
          },
          { status: 400 }
        );
      }

      const workFinishedAt = existing.endDate ?? rosterSummary.lastEndedAt;
      if (!workFinishedAt) {
        return NextResponse.json(
          {
            error:
              "A project with a site register must have an end date before deletion so attendance records can be retained.",
          },
          { status: 400 }
        );
      }

      const retentionUntil = getRosterRetentionUntil(workFinishedAt);
      if (new Date() < retentionUntil) {
        return NextResponse.json(
          {
            error: `This project cannot be deleted until the site register retention period ends (${retentionUntil.toLocaleDateString("en-GB")}).`,
          },
          { status: 400 }
        );
      }
    }

    const projectAttachments = await loadProjectAttachments(tenantId, id);
    const storage = getStorage();
    const deleteResults = await Promise.allSettled(
      projectAttachments.map((attachment) => storage.delete(attachment.fileKey))
    );
    const failedDeletes = deleteResults.filter((result) => result.status === "rejected");
    if (failedDeletes.length > 0) {
      return NextResponse.json(
        {
          error:
            "Could not delete all project attachments from storage. The project was not deleted.",
        },
        { status: 500 }
      );
    }

    await deleteProjectRecord(id, tenantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { code: error?.code ?? "PROJECT_DELETE_FAILED", message: error?.message ?? "Could not delete the project", error: error?.message },
      { status: 500 },
    );
  }
}
