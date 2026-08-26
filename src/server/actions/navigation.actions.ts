"use server";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/server-authorization";
import { revalidatePath } from "next/cache";

const DEFAULT_NAVIGATION_ITEMS = [
  { key: "dashboard", label: "nav.dashboard", icon: "LayoutDashboard", href: "/dashboard", permission: "dashboard", isSimpleMode: true, order: 1 },
  { key: "hmsHandbok", label: "nav.hmsHandbok", icon: "BookOpen", href: "/dashboard/health-safety-policy", permission: "hmsHandbok", isSimpleMode: true, order: 2 },
  { key: "documents", label: "nav.documents", icon: "FileText", href: "/dashboard/documents", permission: "documents", isSimpleMode: true, order: 3 },
  { key: "incidents", label: "nav.incidents", icon: "AlertTriangle", href: "/dashboard/incidents", permission: "incidents", isSimpleMode: true, order: 4 },
  { key: "risks", label: "nav.risks", icon: "ShieldAlert", href: "/dashboard/risks", permission: "risks", isSimpleMode: true, order: 5 },
  { key: "inspections", label: "nav.inspections", icon: "ClipboardCheck", href: "/dashboard/inspections", permission: "inspections", isSimpleMode: true, order: 6 },
  { key: "fireDrills", label: "nav.fireDrills", icon: "Flame", href: "/dashboard/fire-drills", permission: "inspections", isSimpleMode: true, order: 7 },
  { key: "training", label: "nav.training", icon: "GraduationCap", href: "/dashboard/training", permission: "training", isSimpleMode: true, order: 8 },
  { key: "actions", label: "nav.actions", icon: "CheckSquare", href: "/dashboard/actions", permission: "actions", isSimpleMode: true, order: 9 },
  { key: "sja", label: "nav.sja", icon: "HardHat", href: "/dashboard/sja", permission: "sja", isSimpleMode: true, order: 10 },
  { key: "chemicals", label: "nav.chemicals", icon: "Beaker", href: "/dashboard/chemicals", permission: "chemicals", isSimpleMode: true, order: 11 },
  { key: "exposureRegister", label: "nav.exposureRegister", icon: "FlaskConical", href: "/dashboard/exposure-register", permission: "exposureRegister", isSimpleMode: true, order: 12 },
  { key: "projects", label: "nav.projects", icon: "FolderOpen", href: "/dashboard/projects", permission: "constructionCompliance", isSimpleMode: true, order: 13 },
  { key: "constructionCompliance", label: "nav.constructionCompliance", icon: "HardHat", href: "/dashboard/construction-compliance", permission: "constructionCompliance", isSimpleMode: true, order: 14 },
  { key: "hmsTavle", label: "nav.hmsTavle", icon: "Monitor", href: "/dashboard/hms-tavle", permission: "hmsTavle", isSimpleMode: true, order: 15 },
  { key: "environment", label: "nav.environment", icon: "Leaf", href: "/dashboard/environment", permission: "environment", isSimpleMode: true, order: 16 },
  { key: "audits", label: "nav.audits", icon: "Search", href: "/dashboard/audits", permission: "audits", isSimpleMode: true, order: 17 },
  { key: "managementReviews", label: "nav.managementReviews", icon: "Users", href: "/dashboard/management-reviews", permission: "managementReviews", isSimpleMode: true, order: 18 },
  { key: "orgChart", label: "nav.orgChart", icon: "Building2", href: "/dashboard/organisasjonskart", permission: "settings", isSimpleMode: true, order: 97 },
  { key: "users", label: "nav.users", icon: "Users", href: "/dashboard/users", permission: "settings", isSimpleMode: true, order: 98 },
  { key: "settings", label: "nav.settings", icon: "Settings", href: "/dashboard/settings", permission: "settings", isSimpleMode: true, order: 99 },
];

export async function getNavigationItems(tenantId: string) {
  try {
    const context = await requirePermission("canAccessDashboard");

    const tenantItems = await prisma.navigationItem.findMany({
      where: { tenantId },
      orderBy: { order: "asc" },
    });

    if (tenantItems.length === 0) {
      const globalItems = await prisma.navigationItem.findMany({
        where: { tenantId: null, isActive: true },
        orderBy: { order: "asc" },
      });
      return { success: true, data: globalItems };
    }

    return { success: true, data: tenantItems };
  } catch (error: any) {
    console.error("Get navigation items error:", error);
    return { success: false, error: error.message || "Kunne ikke hente meny-items" };
  }
}

export async function initializeDefaultNavigation(tenantId?: string) {
  try {
    const items = DEFAULT_NAVIGATION_ITEMS.map((item) => ({
      ...item,
      tenantId: tenantId || null,
    }));

    await prisma.navigationItem.createMany({
      data: items,
      skipDuplicates: true,
    });

    return { success: true, data: items };
  } catch (error: any) {
    console.error("Initialize navigation error:", error);
    return { success: false, error: error.message || "Kunne ikke initialisere meny" };
  }
}

export async function updateNavigationItem(id: string, data: {
  label?: string;
  icon?: string;
  href?: string;
  isSimpleMode?: boolean;
  isActive?: boolean;
  order?: number;
}) {
  try {
    const context = await requirePermission("canUpdateSettings");

    const updated = await prisma.navigationItem.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Update navigation item error:", error);
    return { success: false, error: error.message || "Kunne ikke oppdatere meny-item" };
  }
}

export async function createNavigationItem(tenantId: string, data: {
  key: string;
  label: string;
  icon?: string;
  href: string;
  permission: string;
  isSimpleMode?: boolean;
  order?: number;
}) {
  try {
    const context = await requirePermission("canUpdateSettings");

    const created = await prisma.navigationItem.create({
      data: {
        ...data,
        tenantId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true, data: created };
  } catch (error: any) {
    console.error("Create navigation item error:", error);
    return { success: false, error: error.message || "Kunne ikke opprette meny-item" };
  }
}

export async function deleteNavigationItem(id: string) {
  try {
    const context = await requirePermission("canUpdateSettings");

    await prisma.navigationItem.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Delete navigation item error:", error);
    return { success: false, error: error.message || "Kunne ikke slette meny-item" };
  }
}

export async function reorderNavigationItems(items: { id: string; order: number }[]) {
  try {
    const context = await requirePermission("canUpdateSettings");

    await Promise.all(
      items.map((item) =>
        prisma.navigationItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error: any) {
    console.error("Reorder navigation items error:", error);
    return { success: false, error: error.message || "Kunne ikke omorganisere meny" };
  }
}
