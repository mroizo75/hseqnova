"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { getYear, getMonth, getWeek } from "date-fns";
import { nb } from "date-fns/locale";

export function ReportExportDropdown() {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const currentYear = getYear(now);
  const currentMonth = getMonth(now) + 1;
  const currentWeek = getWeek(now, { weekStartsOn: 1, locale: nb });

  const buildUrl = (
    format: "excel" | "pdf",
    params: Record<string, string>
  ) => {
    const search = new URLSearchParams({ format, ...params }).toString();
    return `/api/time-registration/report?${search}`;
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Rapporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Excel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleDownload(
              buildUrl("excel", {
                period: "week",
                year: String(currentYear),
                week: String(currentWeek),
              })
            );
          }}
        >
          Denne uken
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleDownload(
              buildUrl("excel", {
                period: "month",
                year: String(currentYear),
                month: String(currentMonth),
              })
            );
          }}
        >
          Denne måneden
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleDownload(
              buildUrl("excel", { period: "year", year: String(currentYear) })
            );
          }}
        >
          {currentYear}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>PDF</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleDownload(
              buildUrl("pdf", {
                period: "month",
                year: String(currentYear),
                month: String(currentMonth),
              })
            );
          }}
        >
          Denne måneden (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleDownload(
              buildUrl("pdf", { period: "year", year: String(currentYear) })
            );
          }}
        >
          {currentYear} (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
