export type PlatformStaff = {
  id: string;
  name: string | null;
  email: string;
  isSuperAdmin: boolean;
  isSupport: boolean;
  isSales: boolean;
  isSalesManager: boolean;
};

export type PlatformRole = "SUPERADMIN" | "SUPPORT" | "SALES_MANAGER" | "SALES" | "NONE";

const SUPERADMIN_ONLY_PREFIXES = [
  "/admin/invoices",
  "/admin/users",
  "/admin/settings",
  "/admin/newsletter",
  "/admin/hms-tavle",
];

export function isPlatformStaff(user: {
  isSuperAdmin?: boolean | null;
  isSupport?: boolean | null;
  isSales?: boolean | null;
  isSalesManager?: boolean | null;
}): boolean {
  return Boolean(user.isSuperAdmin || user.isSupport || user.isSalesManager || user.isSales);
}

export function canSeeAllCrm(user: {
  isSuperAdmin?: boolean | null;
  isSalesManager?: boolean | null;
}): boolean {
  return Boolean(user.isSuperAdmin || user.isSalesManager);
}

export function canSeeOrganisations(user: {
  isSuperAdmin?: boolean | null;
  isSupport?: boolean | null;
  isSalesManager?: boolean | null;
}): boolean {
  return Boolean(user.isSuperAdmin || user.isSupport || user.isSalesManager);
}

export function isSalesOnly(user: {
  isSuperAdmin?: boolean | null;
  isSupport?: boolean | null;
  isSales?: boolean | null;
  isSalesManager?: boolean | null;
}): boolean {
  return Boolean(user.isSales) && !user.isSuperAdmin && !user.isSalesManager && !user.isSupport;
}

export function isSalesStaff(user: {
  isSuperAdmin?: boolean | null;
  isSales?: boolean | null;
  isSalesManager?: boolean | null;
}): boolean {
  return Boolean(user.isSuperAdmin || user.isSalesManager || user.isSales);
}

export function adminHomePath(user: {
  isSuperAdmin?: boolean | null;
  isSupport?: boolean | null;
  isSales?: boolean | null;
  isSalesManager?: boolean | null;
}): string {
  if (user.isSuperAdmin || user.isSupport) {
    return "/admin";
  }
  if (user.isSalesManager || user.isSales) {
    return "/admin/crm";
  }
  return "/dashboard";
}

export function canAccessAdminPath(
  pathname: string,
  user: {
    isSuperAdmin?: boolean | null;
    isSupport?: boolean | null;
    isSales?: boolean | null;
    isSalesManager?: boolean | null;
  },
): boolean {
  if (!pathname.startsWith("/admin")) {
    return true;
  }
  if (!isPlatformStaff(user)) {
    return false;
  }
  if (user.isSuperAdmin) {
    return true;
  }
  if (SUPERADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return false;
  }
  if (user.isSalesManager) {
    return (
      pathname.startsWith("/admin/crm") ||
      pathname.startsWith("/admin/support") ||
      pathname.startsWith("/admin/tenants") ||
      pathname.startsWith("/admin/registrations")
    );
  }
  if (user.isSales) {
    return pathname.startsWith("/admin/crm") || pathname.startsWith("/admin/support");
  }
  if (user.isSupport) {
    if (pathname.startsWith("/admin/crm")) {
      return false;
    }
    return true;
  }
  return false;
}

export function resolvePlatformRole(flags: {
  isSuperAdmin?: boolean | null;
  isSupport?: boolean | null;
  isSalesManager?: boolean | null;
  isSales?: boolean | null;
}): PlatformRole {
  if (flags.isSuperAdmin) return "SUPERADMIN";
  if (flags.isSalesManager) return "SALES_MANAGER";
  if (flags.isSales) return "SALES";
  if (flags.isSupport) return "SUPPORT";
  return "NONE";
}

export function flagsFromPlatformRole(role: PlatformRole): {
  isSuperAdmin: boolean;
  isSupport: boolean;
  isSales: boolean;
  isSalesManager: boolean;
} {
  return {
    isSuperAdmin: role === "SUPERADMIN",
    isSupport: role === "SUPPORT",
    isSales: role === "SALES",
    isSalesManager: role === "SALES_MANAGER",
  };
}

export function crmOwnerFilter(user: {
  id: string;
  isSuperAdmin?: boolean | null;
  isSalesManager?: boolean | null;
}): { ownerId: string } | null {
  if (canSeeAllCrm(user)) {
    return null;
  }
  return { ownerId: user.id };
}
