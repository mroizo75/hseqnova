import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { listContractors } from "@/server/actions/contractor.actions";
import type { PreQualStatus } from "@prisma/client";

const STATUS_STYLES: Record<
  PreQualStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  CONDITIONALLY_APPROVED: { label: "Conditional", variant: "outline" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "secondary" },
};

function isInsuranceExpiringSoon(date: Date | null): boolean {
  if (!date) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return new Date(date).getTime() - Date.now() < thirtyDays && new Date(date).getTime() > Date.now();
}

function isInsuranceExpired(date: Date | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const statusFilter = params.status as PreQualStatus | undefined;
  const contractors = await listContractors(statusFilter);

  const now = new Date();
  const stats = {
    total: contractors.length,
    approved: contractors.filter((c) => c.preQualificationStatus === "APPROVED").length,
    pending: contractors.filter((c) => c.preQualificationStatus === "PENDING").length,
    insuranceExpiring: contractors.filter(
      (c) =>
        isInsuranceExpiringSoon(c.publicLiabilityExpiry) ||
        isInsuranceExpiringSoon(c.employersLiabilityExpiry),
    ).length,
    insuranceExpired: contractors.filter(
      (c) =>
        isInsuranceExpired(c.publicLiabilityExpiry) ||
        isInsuranceExpired(c.employersLiabilityExpiry),
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Contractors</h1>
          <p className="text-sm text-muted-foreground">
            Pre-qualification register — CDM 2015 · MHSWR 1999 reg.7
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto shrink-0">
          <Link href="/dashboard/contractors/new">
            <Plus className="h-4 w-4 mr-1" />
            Register Contractor
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Insurance Alerts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.insuranceExpiring + stats.insuranceExpired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={!statusFilter ? "default" : "outline"} size="sm" asChild>
          <Link href="/dashboard/contractors">All</Link>
        </Button>
        {(Object.keys(STATUS_STYLES) as PreQualStatus[]).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/dashboard/contractors?status=${s}`}>{STATUS_STYLES[s].label}</Link>
          </Button>
        ))}
      </div>

      {/* Insurance Expiry Alerts */}
      {(stats.insuranceExpired > 0 || stats.insuranceExpiring > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {stats.insuranceExpired > 0 && `${stats.insuranceExpired} contractor(s) with expired insurance. `}
                {stats.insuranceExpiring > 0 && `${stats.insuranceExpiring} contractor(s) with insurance expiring within 30 days.`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {contractors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No contractors registered yet.</p>
            <p className="text-sm mt-1">Register a contractor to begin pre-qualification.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contractors.map((c) => {
            const style = STATUS_STYLES[c.preQualificationStatus];
            const eliExpired = isInsuranceExpired(c.employersLiabilityExpiry);
            const pliExpired = isInsuranceExpired(c.publicLiabilityExpiry);
            const hasAlert = eliExpired || pliExpired ||
              isInsuranceExpiringSoon(c.employersLiabilityExpiry) ||
              isInsuranceExpiringSoon(c.publicLiabilityExpiry);

            return (
              <Link
                key={c.id}
                href={`/dashboard/contractors/${c.id}`}
                className="block"
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{c.companyName}</p>
                        {hasAlert && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.tradeCategory ?? "No trade"} · {c.contactName} · {c.contactEmail}
                      </p>
                    </div>
                    <Badge variant={style.variant}>{style.label}</Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
