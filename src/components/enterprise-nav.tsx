"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  ShieldCheck,
  Bell,
  ClipboardList,
  Users,
  FileBarChart,
  LineChart,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { getEnterpriseRoleLabel } from "@/lib/enterprise-permissions";
import type { EnterpriseRole } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  extra?: boolean;
};

const NAV: NavItem[] = [
  { href: "/enterprise", label: "Dashboard", icon: LayoutDashboard },
  { href: "/enterprise/companies", label: "Companies", icon: Building2 },
  { href: "/enterprise/portfolios", label: "Portfolios", icon: FolderTree },
  { href: "/enterprise/assurance", label: "Assurance", icon: ShieldCheck },
  { href: "/enterprise/alerts", label: "Alerts", icon: Bell },
  { href: "/enterprise/standards", label: "Standards", icon: ClipboardList },
  { href: "/enterprise/advisors", label: "Advisors", icon: Users },
  { href: "/enterprise/reports", label: "Reports", icon: FileBarChart },
  { href: "/enterprise/analytics", label: "Analytics", icon: LineChart, extra: true },
  { href: "/enterprise/administration", label: "Administration", icon: Settings },
];

export function EnterpriseNav(props: {
  organisationName: string;
  programmeName: string | null;
  role: EnterpriseRole;
  analyticsEnabled: boolean;
  benchmarkEnabled: boolean;
  showPoweredBy: boolean;
  logoUrl: string | null;
  hasCompanyDashboard: boolean;
  openAlertCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((item) => {
    if (item.href === "/enterprise/analytics") return props.analyticsEnabled || props.benchmarkEnabled;
    return true;
  });

  const brand = (
    <div className="flex items-center gap-2">
      {props.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.logoUrl} alt="" className="h-8 w-auto" />
      ) : (
        <ShieldCheck className="h-6 w-6 text-primary" />
      )}
      <div>
        <h2 className="text-sm font-bold leading-tight">{props.programmeName || props.organisationName}</h2>
        <Badge variant="secondary" className="text-[10px]">
          {getEnterpriseRoleLabel(props.role)}
        </Badge>
      </div>
    </div>
  );

  const links = (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/enterprise"
            ? pathname === "/enterprise"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/enterprise/alerts" && (props.openAlertCount ?? 0) > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                {props.openAlertCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );

  const footer = (
    <div className="border-t p-4 space-y-2">
      {props.hasCompanyDashboard && (
        <Button asChild variant="outline" className="w-full justify-start bg-transparent">
          <Link href="/dashboard">Company workspace</Link>
        </Button>
      )}
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="mr-3 h-4 w-4" />
        Sign out
      </Button>
      {props.showPoweredBy && (
        <p className="px-1 text-[11px] text-muted-foreground">Powered by HSEQ Nova</p>
      )}
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
                <SheetTitle>Enterprise menu</SheetTitle>
              </VisuallyHidden.Root>
              <nav className="space-y-1 p-4">{links}</nav>
              {footer}
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:h-dvh lg:flex-col">
        <div className="border-b p-6">{brand}</div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">{links}</nav>
        {footer}
      </aside>
    </>
  );
}
