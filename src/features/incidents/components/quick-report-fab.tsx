"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function QuickReportFab() {
  return (
    <Link
      href="/ansatt/quick-report"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors"
    >
      <AlertTriangle className="h-6 w-6" />
    </Link>
  );
}
