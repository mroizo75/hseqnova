"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/riddor", label: "RIDDOR" },
  { href: "/rams", label: "RAMS" },
  { href: "/digital-safety-board", label: "Safety board" },
] as const;

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-black.png"
              alt="HSEQ Nova"
              width={200}
              height={48}
              className="h-16 w-auto"
              priority
            />
          </Link>

          <div className="hidden items-center gap-4 lg:flex xl:gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Start now</Link>
            </Button>
          </div>

          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-md lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t py-4 lg:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2">
              <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  Log in
                </Button>
              </Link>
              <Button asChild size="sm" className="w-full">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  Start now
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
