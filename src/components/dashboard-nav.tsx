"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
  FileBarChart,
  Leaf,
  HardHat,
  FlaskConical,
  FolderOpen,
  Building2,
  Flame,
  Monitor,
  Headphones,
  BookOpen,
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

const navItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: string;
}> = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { href: "/dashboard/health-safety-policy", label: "nav.hmsHandbok", icon: BookOpen, permission: "hmsHandbok" },
  { href: "/dashboard/documents", label: "nav.documents", icon: FileText, permission: "documents" },
  { href: "/dashboard/incidents", label: "nav.incidents", icon: AlertCircle, permission: "incidents" },
  { href: "/dashboard/risks", label: "nav.risks", icon: AlertTriangle, permission: "risks" },
  { href: "/dashboard/inspections", label: "nav.inspections", icon: ShieldCheck, permission: "inspections" },
  { href: "/dashboard/fire-drills", label: "nav.fireDrills", icon: Flame, permission: "inspections" },
  { href: "/dashboard/training", label: "nav.training", icon: GraduationCap, permission: "training" },
  { href: "/dashboard/actions", label: "nav.actions", icon: ListTodo, permission: "actions" },
  { href: "/dashboard/sja", label: "nav.sja", icon: HardHat, permission: "sja" },
  { href: "/dashboard/chemicals", label: "nav.chemicals", icon: Beaker, permission: "chemicals" },
  { href: "/dashboard/exposure-register", label: "nav.exposureRegister", icon: FlaskConical, permission: "exposureRegister" },
  { href: "/dashboard/projects", label: "nav.projects", icon: FolderOpen, permission: "constructionCompliance" },
  { href: "/dashboard/construction-compliance", label: "nav.constructionCompliance", icon: HardHat, permission: "constructionCompliance" },
  { href: "/dashboard/hms-tavle", label: "nav.hmsTavle", icon: Monitor, permission: "hmsTavle" },
  { href: "/dashboard/environment", label: "nav.environment", icon: Leaf, permission: "environment" },
  { href: "/dashboard/audits", label: "nav.audits", icon: ClipboardCheck, permission: "audits" },
  { href: "/dashboard/management-reviews", label: "nav.managementReviews", icon: FileBarChart, permission: "managementReviews" },
  { href: "/dashboard/organisasjonskart", label: "nav.orgChart", icon: Building2, permission: "settings" },
  { href: "/dashboard/users", label: "nav.users", icon: Users, permission: "settings" },
  { href: "/dashboard/support", label: "nav.support", icon: Headphones, permission: "support" },
  { href: "/dashboard/settings", label: "nav.settings", icon: Settings, permission: "settings" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session } = useSession();
  const { visibleNavItems, role, permissions } = usePermissions();
  const [moduleVisibility, setModuleVisibility] = useState<ModuleVisibilityConfig | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchTenantFeatures = async () => {
      if (!session?.user?.tenantId) {
        if (isMounted) {
          setModuleVisibility(null);
        }
        return;
      }

      try {
        const response = await fetch("/api/user/tenants");
        if (!response.ok) {
          if (isMounted) {
            setModuleVisibility(null);
          }
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
        if (isMounted) {
          setModuleVisibility(null);
        }
      }
    };

    fetchTenantFeatures();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.tenantId]);

  const allowedNavItems = navItems.filter((item) => {
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
        permissions
      )
    ) {
      return false;
    }
    return true;
  });

  const tenantName = session?.user?.tenantName;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:h-dvh lg:flex-col">
      <div className="flex h-full flex-col">
        <div className="border-b p-6">
          <div className="flex items-start justify-between mb-2">
            <Image src="/logo-black.png" alt="HSEQ Nova" width={200} height={48} className="h-9 w-auto" />
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

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </Link>
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
