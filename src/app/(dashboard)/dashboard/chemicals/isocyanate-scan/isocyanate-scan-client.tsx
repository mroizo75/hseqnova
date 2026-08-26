"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Loader2,
  Info,
  FileWarning,
  ExternalLink,
  Edit,
} from "lucide-react";
import Link from "next/link";
import {
  scanStoffkartotekForIsocyanates,
  getIsocyanateStats,
  type IsocyanateScanResult,
} from "@/server/actions/chemical-isocyanate-scan.actions";
import { useToast } from "@/hooks/use-toast";

type IsocyanateStats = {
  total: number;
  withIsocyanates: number;
  percentage: number;
  chemicals: Array<{
    id: string;
    productName: string;
    supplier: string | null;
    casNumber: string | null;
    quantity: number | null;
    location: string | null;
  }>;
};

export function IsocyanateScanClient() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<IsocyanateScanResult | null>(null);
  const [stats, setStats] = useState<IsocyanateStats | null>(null);
  const { toast } = useToast();

  useState(() => {
    loadStats();
  });

  async function loadStats() {
    try {
      const data = await getIsocyanateStats();
      setStats(data);
    } catch {
      // Stats are optional on first paint.
    }
  }

  async function handleScan() {
    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await scanStoffkartotekForIsocyanates();
      setScanResult(result);

      if (result.updated > 0) {
        toast({
          title: "Scan complete",
          description: `Found and marked ${result.foundIsocyanates} chemicals containing diisocyanates`,
        });
      } else {
        toast({
          title: "Scan complete",
          description: "No new chemicals containing diisocyanates were found",
        });
      }

      await loadStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Scan failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diisocyanate scan</h1>
        <p className="text-muted-foreground mt-2">
          Scan the COSHH register for products containing diisocyanates
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Why this matters</AlertTitle>
        <AlertDescription>
          <strong>UK REACH</strong> (retained EU restriction 2020/1149) requires training for
          industrial and professional use of substances or mixtures with ≥0.1% diisocyanates.
          <br />
          Common diisocyanates: MDI, TDI, HDI, IPDI (used in coatings, adhesives, foam and insulation).
        </AlertDescription>
      </Alert>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Chemicals in the COSHH register</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">With diisocyanates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.withIsocyanates}</div>
              <p className="text-xs text-muted-foreground">
                {stats.percentage}% of the COSHH register
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.withIsocyanates > 0 ? (
                <Badge variant="outline" className="text-orange-600">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Follow-up required
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  None found
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Scan the COSHH register</CardTitle>
          <CardDescription>
            The system searches all registered chemicals and identifies products that contain
            diisocyanates based on product name, CAS number and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleScan}
            disabled={isScanning}
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Start scan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {scanResult && (
        <Card>
          <CardHeader>
            <CardTitle>Scan results</CardTitle>
            <CardDescription>
              {scanResult.success ? "Scan complete" : "Scan failed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Scanned</p>
                <p className="text-2xl font-bold">{scanResult.totalScanned}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Found</p>
                <p className="text-2xl font-bold text-orange-600">
                  {scanResult.foundIsocyanates}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Updated</p>
                <p className="text-2xl font-bold text-green-600">
                  {scanResult.updated}
                </p>
              </div>
            </div>

            {scanResult.chemicals.length > 0 && (
              <div className="space-y-2">
                <div>
                  <h3 className="text-sm font-medium">
                    Chemicals containing diisocyanates ({scanResult.chemicals.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Open a product to edit it, add a risk assessment or note training for employees.
                  </p>
                </div>
                <div className="border rounded-lg divide-y">
                  {scanResult.chemicals.map((chemical) => (
                    <div
                      key={chemical.id}
                      className="p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FileWarning className="h-4 w-4 text-orange-600 shrink-0" />
                            <Link
                              href={`/dashboard/chemicals/${chemical.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline text-primary"
                            >
                              {chemical.productName}
                            </Link>
                            {chemical.wasUpdated && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Updated
                              </Badge>
                            )}
                          </div>
                          {chemical.supplier && (
                            <p className="text-sm text-muted-foreground">
                              Supplier: {chemical.supplier}
                            </p>
                          )}
                          {chemical.casNumber && (
                            <p className="text-sm text-muted-foreground">
                              CAS: {chemical.casNumber}
                            </p>
                          )}
                          {chemical.isocyanateDetails && (
                            <Alert className="mt-2">
                              <AlertDescription className="text-sm">
                                {chemical.isocyanateDetails}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Link
                            href={`/dashboard/chemicals/${chemical.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              Open
                            </Button>
                          </Link>
                          <Link
                            href={`/dashboard/chemicals/${chemical.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" className="text-muted-foreground">
                              <Edit className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scanResult.foundIsocyanates === 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>No diisocyanates found</AlertTitle>
                <AlertDescription>
                  The COSHH register does not contain chemicals with diisocyanates.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {stats?.chemicals && stats.chemicals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registered chemicals containing diisocyanates</CardTitle>
            <CardDescription>
              Chemicals already marked as containing diisocyanates. Open in a new tab to edit,
              add a risk assessment or record training notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg divide-y">
              {stats.chemicals.map((chemical) => (
                <div
                  key={chemical.id}
                  className="p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
                        <Link
                          href={`/dashboard/chemicals/${chemical.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline text-primary"
                        >
                          {chemical.productName}
                        </Link>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                        {chemical.supplier && <span>Supplier: {chemical.supplier}</span>}
                        {chemical.casNumber && <span>CAS: {chemical.casNumber}</span>}
                        {chemical.quantity && <span>Quantity: {chemical.quantity}</span>}
                        {chemical.location && <span>Location: {chemical.location}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Link
                        href={`/dashboard/chemicals/${chemical.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Open
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/chemicals/${chemical.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <Edit className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
