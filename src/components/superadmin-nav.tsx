"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  Settings,
  LogOut,
  Shield,
  Headphones,
  UserPlus,
  Scale,
  Menu,
  Kanban,
  Briefcase,
  ListTodo,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { canAccessAdminPath } from "@/lib/platform-access";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const allNavItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/crm", label: "Sales", icon: Briefcase },
  { href: "/admin/crm/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/admin/crm/companies", label: "Companies", icon: Building2 },
  { href: "/admin/crm/tasks", label: "Tasks", icon: ListTodo },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/registrations", label: "New registrations", icon: UserPlus },
  { href: "/admin/tenants", label: "Organisations", icon: Building2 },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/legal-references", label: "Legal register", icon: Scale },
  { href: "/admin/newsletter", label: "Newsletter", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface SuperAdminNavProps {
  isSuperAdmin: boolean;
  isSupport: boolean;
  isSales?: boolean;
  isSalesManager?: boolean;
  hasTenant?: boolean;
  openSupportCount?: number;
}

function roleBadge(props: SuperAdminNavProps) {
  if (props.isSuperAdmin) return { label: "SUPERADMIN", className: "bg-primary/10 text-primary" };
  if (props.isSalesManager) return { label: "SALES MANAGER", className: "bg-amber-100 text-amber-800" };
  if (props.isSales) return { label: "SALES", className: "bg-emerald-100 text-emerald-800" };
  return { label: "SUPPORT", className: "bg-blue-100 text-blue-700" };
}

function NavLinks({
  navItems,
  pathname,
  openSupportCount,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  openSupportCount: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : item.href === "/admin/crm"
              ? pathname === "/admin/crm"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.href === "/admin/support" && openSupportCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                {openSupportCount > 99 ? "99+" : openSupportCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

function NavFooter({
  hasTenant,
  onNavigate,
}: {
  hasTenant: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="border-t p-4 space-y-2">
      {hasTenant && (
        <Button asChild variant="outline" className="w-full justify-start bg-transparent">
          <Link href="/dashboard" onClick={onNavigate}>
            <LayoutDashboard className="mr-3 h-4 w-4" />
            To customer dashboard
          </Link>
        </Button>
      )}
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          onNavigate?.();
          signOut({ callbackUrl: "/login" });
        }}
      >
        <LogOut className="mr-3 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

export function SuperAdminNav({
  isSuperAdmin,
  isSupport,
  isSales = false,
  isSalesManager = false,
  hasTenant = false,
  openSupportCount = 0,
}: SuperAdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const staff = { isSuperAdmin, isSupport, isSales, isSalesManager };
  const navItems = allNavItems.filter((item) => canAccessAdminPath(item.href, staff));
  const badge = roleBadge({ isSuperAdmin, isSupport, isSales, isSalesManager });

  const brand = (
    <div className="flex items-center gap-2">
      {isSuperAdmin ? (
        <Shield className="h-6 w-6 text-primary" />
      ) : isSalesManager || isSales ? (
        <Briefcase className="h-6 w-6 text-amber-700" />
      ) : (
        <Headphones className="h-6 w-6 text-blue-600" />
      )}
      <div>
        <h2 className="text-lg font-bold">HSEQ Nova</h2>
        <Badge variant="secondary" className={cn("text-xs", badge.className)}>
          {badge.label}
        </Badge>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-50 border-b bg-card pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {brand}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <VisuallyHidden.Root>
                <SheetTitle>Admin menu</SheetTitle>
              </VisuallyHidden.Root>
              <div className="flex h-full flex-col">
                <div className="border-b p-6">{brand}</div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                  <NavLinks
                    navItems={navItems}
                    pathname={pathname}
                    openSupportCount={openSupportCount}
                    onNavigate={() => setOpen(false)}
                  />
                </nav>
                <NavFooter hasTenant={hasTenant} onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:h-dvh lg:flex-col">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">{brand}</div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <NavLinks
              navItems={navItems}
              pathname={pathname}
              openSupportCount={openSupportCount}
            />
          </nav>
          <NavFooter hasTenant={hasTenant} />
        </div>
      </aside>
    </>
  );
}
