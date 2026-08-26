"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EnvironmentReportButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleDownload = async (year: number) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/environment/report/${year}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not generate the report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `environmental-report-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report generated",
        description: `Environmental report for ${year} has been downloaded`,
        className: "bg-green-50 border-green-200",
      });
    } catch (error: any) {
      toast({
        title: "Could not generate report",
        description: error.message || "Could not generate the environmental report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Environmental report
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select year</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload(currentYear)}>
          <Download className="mr-2 h-4 w-4" />
          {currentYear} (current year)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload(currentYear - 1)}>
          <Download className="mr-2 h-4 w-4" />
          {currentYear - 1}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload(currentYear - 2)}>
          <Download className="mr-2 h-4 w-4" />
          {currentYear - 2}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          The report includes measurements, objectives and actions for the selected year
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
