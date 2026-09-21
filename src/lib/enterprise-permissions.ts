import type { EnterpriseRole } from "@prisma/client";

export interface EnterprisePermissions {
  canManageOrganisation: boolean;
  canManageUsers: boolean;
  canManagePortfolios: boolean;
  canManageStandards: boolean;
  canManageBranding: boolean;
  canImportCompanies: boolean;
  canInviteCompanies: boolean;
  canViewAllPortfolios: boolean;
  canViewAssurance: boolean;
  canManageAlerts: boolean;
  canRequestImprovement: boolean;
  canViewAnalytics: boolean;
  canViewBenchmark: boolean;
  canAssignAdvisors: boolean;
  canExportReports: boolean;
  canViewEvidence: boolean;
}

const ALL: EnterprisePermissions = {
  canManageOrganisation: true,
  canManageUsers: true,
  canManagePortfolios: true,
  canManageStandards: true,
  canManageBranding: true,
  canImportCompanies: true,
  canInviteCompanies: true,
  canViewAllPortfolios: true,
  canViewAssurance: true,
  canManageAlerts: true,
  canRequestImprovement: true,
  canViewAnalytics: true,
  canViewBenchmark: true,
  canAssignAdvisors: true,
  canExportReports: true,
  canViewEvidence: true,
};

const READ: EnterprisePermissions = {
  canManageOrganisation: false,
  canManageUsers: false,
  canManagePortfolios: false,
  canManageStandards: false,
  canManageBranding: false,
  canImportCompanies: false,
  canInviteCompanies: false,
  canViewAllPortfolios: true,
  canViewAssurance: true,
  canManageAlerts: false,
  canRequestImprovement: false,
  canViewAnalytics: true,
  canViewBenchmark: true,
  canAssignAdvisors: false,
  canExportReports: true,
  canViewEvidence: true,
};

export const enterpriseRolePermissions: Record<EnterpriseRole, EnterprisePermissions> = {
  OWNER: ALL,
  ADMIN: { ...ALL, canManageOrganisation: true },
  PORTFOLIO_MANAGER: {
    ...READ,
    canViewAllPortfolios: false,
    canInviteCompanies: true,
    canRequestImprovement: true,
    canManageAlerts: true,
  },
  HSEQ_MANAGER: {
    ...READ,
    canRequestImprovement: true,
    canManageAlerts: true,
    canManageStandards: true,
  },
  RISK_MANAGER: {
    ...READ,
    canRequestImprovement: true,
    canManageAlerts: true,
  },
  ADVISOR: {
    ...READ,
    canRequestImprovement: true,
    canViewEvidence: true,
  },
  AUDITOR: {
    ...READ,
    canRequestImprovement: false,
    canViewEvidence: true,
    canViewAnalytics: false,
  },
  READ_ONLY: {
    ...READ,
    canViewEvidence: false,
    canExportReports: true,
  },
};

export function getEnterprisePermissions(role: EnterpriseRole): EnterprisePermissions {
  return enterpriseRolePermissions[role];
}

export function hasEnterprisePermission(
  role: EnterpriseRole,
  permission: keyof EnterprisePermissions,
): boolean {
  return enterpriseRolePermissions[role][permission];
}

export function getEnterpriseRoleLabel(role: EnterpriseRole): string {
  const labels: Record<EnterpriseRole, string> = {
    OWNER: "Owner",
    ADMIN: "Administrator",
    PORTFOLIO_MANAGER: "Portfolio manager",
    HSEQ_MANAGER: "HSEQ manager",
    RISK_MANAGER: "Risk manager",
    ADVISOR: "Advisor",
    AUDITOR: "Auditor",
    READ_ONLY: "Read only",
  };
  return labels[role];
}

export function canScopeToPortfolios(role: EnterpriseRole): boolean {
  return role === "PORTFOLIO_MANAGER";
}
