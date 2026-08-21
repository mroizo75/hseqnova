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
        throw new Error(error.error || "Kunne ikke generere rapport");
      }

      // Last ned PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Miljorapport_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "✅ Rapport generert!",
        description: `Miljørapport for ${year} er lastet ned`,
        className: "bg-green-50 border-green-200",
      });
    } catch (error: any) {
      console.error("Report generation error:", error);
      toast({
        title: "Feil ved generering",
        description: error.message || "Kunne ikke generere miljørapport",
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
              Genererer...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Miljørapport
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Velg år</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload(currentYear)}>
          <Download className="mr-2 h-4 w-4" />
          {currentYear} (Inneværende år)
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
          Rapporten inkluderer målinger, mål og tiltak for valgt år
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
