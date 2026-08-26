"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
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
  Menu,
  HardHat,
  FlaskConical,
  FolderOpen,
  Building2,
  Monitor,
  Headphones,
  BookOpen,
  Flame,
  Leaf,
  FileBarChart,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { getRoleDisplayName } from "@/lib/permissions";
import Image from "next/image";
import { NotificationBell } from "@/components/notifications/notification-bell";
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

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const { data: session } = useSession();
  const { visibleNavItems, role, permissions } = usePermissions();
  const [open, setOpen] = useState(false);
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

  return (
    <div className="lg:hidden">
      <div className="sticky top-0 z-50 border-b bg-card pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3">
          <Image src="/logo-black.png" alt="HSEQ Nova" width={200} height={48} className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <VisuallyHidden.Root>
                <SheetTitle>{t("mobileNav.navigationMenu")}</SheetTitle>
              </VisuallyHidden.Root>
              <div className="flex h-full flex-col">
                <div className="border-b p-6">
                  <Image src="/logo-black.png" alt="HSEQ Nova" width={200} height={48} className="h-9 w-auto" />
                  {role && (
                    <Badge variant="outline" className="mt-2 text-xs bg-transparent">
                      {getRoleDisplayName(role)}
                    </Badge>
                  )}
                </div>

                <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                  {allowedNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {t(item.label)}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t p-4">
                  <div className="mb-3 px-3 text-xs text-muted-foreground truncate">
                    {session?.user?.name || session?.user?.email}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {t("auth.logout")}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
