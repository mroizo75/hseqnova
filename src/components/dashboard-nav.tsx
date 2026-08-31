"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  ClipboardCheck,
  ListTodo,
  Settings,
  Users,
  LogOut,
  Beaker,
  ShieldCheck,
  HardHat,
  FileKey,
  FlaskConical,
  Wrench,
  FolderOpen,
  Building2,
  Flame,
  Monitor,
  Headphones,
  BookOpen,
  Leaf,
  FileBarChart,
  ChevronDown,
  Gauge,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { getRoleDisplayName } from "@/lib/permissions";
import Image from "next/image";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { TenantSwitcher } from "@/components/auth/tenant-switcher";
import {
  isNavItemAllowedByModuleVisibility,
  type ModuleVisibilityConfig,
} from "@/lib/module-visibility";
import { NAV_PERMISSION_TO_MODULE_KEY, tenantHasModule } from "@/lib/tenant-modules";
import { Role } from "@prisma/client";
import { UK_EXCLUDED_NAV_HREFS } from "@/lib/dashboard-nav-config";

interface TenantApiResponseItem {
  id: string;
  features?: string[];
  moduleVisibilityConfig?: ModuleVisibilityConfig | null;
  enabledModules?: string[];
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "overview",
    label: "nav.group.overview",
    items: [
      { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard, permission: "dashboard" },
      { href: "/dashboard/health-safety-policy", label: "nav.hmsHandbok", icon: BookOpen, permission: "hmsHandbok" },
    ],
  },
  {
    id: "reporting",
    label: "nav.group.reporting",
    items: [
      { href: "/dashboard/incidents", label: "nav.incidents", icon: AlertCircle, permission: "incidents" },
      { href: "/dashboard/risks", label: "nav.risks", icon: AlertTriangle, permission: "risks" },
      { href: "/dashboard/inspections", label: "nav.inspections", icon: ShieldCheck, permission: "inspections" },
      { href: "/dashboard/fire-drills", label: "nav.fireDrills", icon: Flame, permission: "inspections" },
      { href: "/dashboard/actions", label: "nav.actions", icon: ListTodo, permission: "actions" },
    ],
  },
  {
    id: "operations",
    label: "nav.group.operations",
    items: [
      { href: "/dashboard/documents", label: "nav.documents", icon: FileText, permission: "documents" },
      { href: "/dashboard/training", label: "nav.training", icon: GraduationCap, permission: "training" },
      { href: "/dashboard/sja", label: "nav.sja", icon: HardHat, permission: "sja" },
      { href: "/dashboard/permits", label: "nav.permits", icon: FileKey, permission: "permits" },
      { href: "/dashboard/chemicals", label: "nav.chemicals", icon: Beaker, permission: "chemicals" },
      { href: "/dashboard/coshh-assessments", label: "nav.coshhAssessments", icon: FlaskConical, permission: "chemicals" },
      { href: "/dashboard/assets", label: "nav.assets", icon: Wrench, permission: "assets" },
      { href: "/dashboard/exposure-register", label: "nav.exposureRegister", icon: FlaskConical, permission: "exposureRegister" },
    ],
  },
  {
    id: "construction",
    label: "nav.group.construction",
    items: [
      { href: "/dashboard/projects", label: "nav.projects", icon: FolderOpen, permission: "constructionCompliance" },
      { href: "/dashboard/construction-compliance", label: "nav.constructionCompliance", icon: HardHat, permission: "constructionCompliance" },
      { href: "/dashboard/hms-tavle", label: "nav.hmsTavle", icon: Monitor, permission: "hmsTavle" },
    ],
  },
  {
    id: "compliance",
    label: "nav.group.compliance",
    items: [
      { href: "/dashboard/hseq-cockpit", label: "nav.hseqCockpit", icon: Gauge, permission: "hseqCockpit" },
      { href: "/dashboard/fire-risk", label: "nav.fireRisk", icon: Flame, permission: "fireRisk" },
      { href: "/dashboard/environment", label: "nav.environment", icon: Leaf, permission: "environment" },
      { href: "/dashboard/audits", label: "nav.audits", icon: ClipboardCheck, permission: "audits" },
      { href: "/dashboard/management-reviews", label: "nav.managementReviews", icon: FileBarChart, permission: "managementReviews" },
      { href: "/dashboard/whistleblowing", label: "nav.whistleblowing", icon: Megaphone, permission: "whistleblowing" },
    ],
  },
  {
    id: "admin",
    label: "nav.group.admin",
    items: [
      { href: "/dashboard/organisasjonskart", label: "nav.orgChart", icon: Building2, permission: "settings" },
      { href: "/dashboard/users", label: "nav.users", icon: Users, permission: "settings" },
      { href: "/dashboard/support", label: "nav.support", icon: Headphones, permission: "support" },
      { href: "/dashboard/settings", label: "nav.settings", icon: Settings, permission: "settings" },
    ],
  },
];

const GROUP_LABELS: Record<string, string> = {
  "nav.group.overview": "Overview",
  "nav.group.reporting": "Reporting",
  "nav.group.operations": "Operations",
  "nav.group.construction": "Construction",
  "nav.group.compliance": "Compliance",
  "nav.group.admin": "Administration",
};

const STORAGE_KEY = "hseq-nav-collapsed";

function loadCollapsed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCollapsed(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function DashboardNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session } = useSession();
  const { visibleNavItems, role, permissions } = usePermissions();
  const [moduleVisibility, setModuleVisibility] = useState<ModuleVisibilityConfig | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(loadCollapsed());
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      saveCollapsed(next);
      return next;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchTenantFeatures = async () => {
      if (!session?.user?.tenantId) {
        if (isMounted) setModuleVisibility(null);
        return;
      }

      try {
        const response = await fetch("/api/user/tenants");
        if (!response.ok) {
          if (isMounted) setModuleVisibility(null);
          return;
        }

        const data: { tenants?: TenantApiResponseItem[] } = await response.json();
        const currentTenant = (data.tenants ?? []).find(
          (tenant) => tenant.id === session.user.tenantId,
        );
        if (isMounted) {
          setModuleVisibility(currentTenant?.moduleVisibilityConfig ?? null);
          setEnabledModules(currentTenant?.enabledModules ?? []);
        }
      } catch {
        if (isMounted) setModuleVisibility(null);
      }
    };

    fetchTenantFeatures();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.tenantId]);

  function isItemAllowed(item: NavItem): boolean {
    if (UK_EXCLUDED_NAV_HREFS.has(item.href)) return false;
    if (!visibleNavItems[item.permission as keyof typeof visibleNavItems]) return false;
    const moduleKey = NAV_PERMISSION_TO_MODULE_KEY[item.permission];
    if (moduleKey && !tenantHasModule(enabledModules, moduleKey)) return false;
    if (
      role &&
      !isNavItemAllowedByModuleVisibility(
        item.permission,
        role as Role,
        moduleVisibility,
        permissions,
      )
    ) {
      return false;
    }
    return true;
  }

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(isItemAllowed),
    }))
    .filter((group) => group.items.length > 0);

  const tenantName = session?.user?.tenantName;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:h-dvh lg:flex-col">
      <div className="flex h-full flex-col">
        <div className="border-b p-6">
          <div className="flex items-start justify-between mb-2">
            <Image src="/logo-black.png" alt="HSEQ Nova" width={200} height={48} className="h-16 w-auto" />
            <NotificationBell />
          </div>
          {tenantName && (
            <p className="text-sm font-semibold text-foreground mt-3 truncate">
              {tenantName}
            </p>
          )}
          {role && (
            <Badge variant="outline" className="mt-2 text-xs bg-transparent">
              {getRoleDisplayName(role)}
            </Badge>
          )}
          <div className="mt-3">
            <TenantSwitcher />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {visibleGroups.map((group) => {
            const isCollapsed = collapsed[group.id] ?? false;
            const hasActiveChild = group.items.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
            );

            return (
              <div key={group.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors",
                    hasActiveChild && "text-foreground",
                  )}
                >
                  <span>{GROUP_LABELS[group.label] ?? group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      isCollapsed && "-rotate-90",
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t(item.label)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-2 px-3 text-xs text-muted-foreground truncate">
            {session?.user?.name || session?.user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-3 h-4 w-4" />
            {t("auth.logout")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
