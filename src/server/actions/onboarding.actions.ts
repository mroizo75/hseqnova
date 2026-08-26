"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminDb } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";
import { BASE_SIMPLE_MODULES } from "@/lib/bransje-modules";
import { menuPathsToWidgetIds } from "@/lib/menu-widget-sync";
import type { Role } from "@prisma/client";

// ── Tilsynsklar-veiviser typer ──────────────────────────────────────────────

export type SetupGuideStep = {
  key: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  icon: string;
};

export type SetupGuideProgress = {
  steps: SetupGuideStep[];
  totalCompleted: number;
  totalSteps: number;
  hidden: boolean;
};

// ── Schemas ──────────────────────────────────────────────────────────────────

const completeStartpakkeSchema = z.object({
  tenantId: z.string().min(1),
  bransje: z.string().optional(),
});

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * Marks onboarding complete. Industry does not change the UK menu.
 */
export async function completeStartpakkeSetup(
  input: z.infer<typeof completeStartpakkeSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tenantId } = completeStartpakkeSchema.parse(input);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.tenantId !== tenantId) {
      return { success: false, error: "Not authorised" };
    }

    const permissions = getPermissions(session.user.role as Role);
    if (!permissions.canUpdateSettings) {
      return { success: false, error: "Only an administrator can finish setup" };
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        simpleMenuItems: BASE_SIMPLE_MODULES,
        startpakkeCompleted: true,
        onboardingStatus: "IN_PROGRESS",
        setupGuideHidden: false,
      },
    });

    const widgetIds = menuPathsToWidgetIds(BASE_SIMPLE_MODULES);
    await prisma.dashboardConfig.upsert({
      where: {
        userId_tenantId: { userId: session.user.id, tenantId },
      },
      create: {
        userId: session.user.id,
        tenantId,
        widgets: widgetIds.map((id, order) => ({ id, order, type: "builtin" })),
      },
      update: {
        widgets: widgetIds.map((id, order) => ({ id, order, type: "builtin" })),
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Setup could not be completed" };
  }
}

/** Industry pickers are not used. */
export async function shouldShowStartpakke(_tenantId: string): Promise<boolean> {
  return false;
}

/**
 * Hopp over startpakke-wizard uten å velge bransje.
 * Markerer startpakkeCompleted slik at wizard ikke vises igjen.
 */
export async function skipStartpakke(tenantId: string): Promise<{ success: boolean }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.tenantId !== tenantId) {
      return { success: false };
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        startpakkeCompleted: true,
        simpleMenuItems: BASE_SIMPLE_MODULES,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ── Tilsynsklar-veiviser ────────────────────────────────────────────────────

const SETUP_STEPS: Omit<SetupGuideStep, "completed">[] = [
  {
    key: "add_employees",
    title: "Add people",
    description: "Invite employees so they can use the accident book, training and the policy",
    href: "/dashboard/users",
    icon: "Users",
  },
  {
    key: "org_chart",
    title: "Set out the organisation",
    description: "Roles, responsibilities and authority (HSWA 1974 s.2(3) organisation)",
    href: "/dashboard/organisasjonskart",
    icon: "Network",
  },
  {
    key: "handbook",
    title: "Set up the health and safety policy",
    description: "Statement of intent, organisation and arrangements (HSWA s.2(3))",
    href: "/dashboard/health-safety-policy",
    icon: "BookOpen",
  },
  {
    key: "risk_assessment",
    title: "Complete the first risk assessment",
    description: "Suitable and sufficient assessment of risks (MHSWR 1999 reg.3)",
    href: "/dashboard/risks",
    icon: "ShieldAlert",
  },
  {
    key: "handbook_signatures",
    title: "Get employees to confirm they have read the policy",
    description: "Record that employees have read and understood the policy",
    href: "/dashboard/health-safety-policy",
    icon: "PenLine",
  },
];

export async function getSetupGuideProgress(
  tenantId: string,
): Promise<SetupGuideProgress | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        startpakkeCompleted: true,
        setupGuideHidden: true,
        onboardingStatus: true,
      },
    });

    if (!tenant || !tenant.startpakkeCompleted) return null;
    if (tenant.setupGuideHidden) return null;
    if (tenant.onboardingStatus === "COMPLETED") return null;

    const [employeeCount, orgNodeCount, riskCount, handbook] =
      await Promise.all([
        prisma.userTenant.count({
          where: { tenantId, role: { not: "ADMIN" } },
        }),
        prisma.orgChartNode.count({ where: { tenantId } }),
        prisma.riskAssessment.count({ where: { tenantId } }),
        prisma.hmsHandbook.findUnique({
          where: { tenantId },
          select: {
            id: true,
            currentVersionId: true,
          },
        }),
      ]);

    let handbookEdited = false;
    let signatureCount = 0;

    if (handbook) {
      const versionId = handbook.currentVersionId;

      if (versionId) {
        const [editedSections, sigCount] = await Promise.all([
          prisma.handbookSection.count({
            where: {
              versionId,
              content: { not: { startsWith: "<p>Beskriv" } },
              NOT: {
                content: {
                  startsWith: "<p>Kartlegging",
                },
              },
            },
          }),
          prisma.handbookSignature.count({
            where: { handbookId: handbook.id },
          }),
        ]);

        handbookEdited = editedSections >= 3;
        signatureCount = sigCount;
      }
    }

    const completionMap: Record<string, boolean> = {
      add_employees: employeeCount >= 1,
      org_chart: orgNodeCount >= 2,
      handbook: handbookEdited,
      risk_assessment: riskCount >= 1,
      handbook_signatures: signatureCount >= 1,
    };

    const steps: SetupGuideStep[] = SETUP_STEPS.map((step) => ({
      ...step,
      completed: completionMap[step.key] ?? false,
    }));

    const totalCompleted = steps.filter((s) => s.completed).length;

    return {
      steps,
      totalCompleted,
      totalSteps: steps.length,
      hidden: tenant.setupGuideHidden,
    };
  } catch {
    return null;
  }
}

const toggleGuideSchema = z.object({
  tenantId: z.string().min(1),
  hidden: z.boolean(),
});

export async function toggleSetupGuideVisibility(
  input: z.infer<typeof toggleGuideSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { tenantId, hidden } = toggleGuideSchema.parse(input);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.tenantId !== tenantId) {
      return { success: false, error: "Ikke autorisert" };
    }

    const permissions = getPermissions(session.user.role as Role);
    if (!permissions.canUpdateSettings) {
      return { success: false, error: "Kun admin kan endre veiviser-visning" };
    }

    const { error } = await getAdminDb()
      .from("Tenant")
      .update({ setupGuideHidden: hidden, updatedAt: new Date().toISOString() })
      .eq("id", tenantId);
    if (error) {
      return { success: false, error: "Noe gikk galt" };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Noe gikk galt" };
  }
}
