import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { loadCrmCompanies } from "@/server/queries/crm.queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CRM_SOURCE_LABELS, CRM_STAGE_LABELS, formatGbp } from "@/features/crm/lib/labels";
import type { CrmSource, CrmDealStage } from "@/features/crm/lib/types";

export default async function CrmCompaniesPage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const companies = await loadCrmCompanies(staff);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Prospects and customers in the sales CRM</p>
        </div>
        <Button asChild>
          <Link href="/admin/crm/companies/new">Add company</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{companies.length} companies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Open deal</TableHead>
                <TableHead>Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No companies yet
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link href={`/admin/crm/companies/${company.id}`} className="font-medium hover:underline">
                        {company.name}
                      </Link>
                      {company.companyNumber && (
                        <p className="text-xs text-muted-foreground">{company.companyNumber}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {CRM_SOURCE_LABELS[company.source as CrmSource] ?? company.source}
                    </TableCell>
                    <TableCell>{company.owner?.name || company.owner?.email || "Unassigned"}</TableCell>
                    <TableCell>
                      {company.openDeal ? (
                        <span>
                          {CRM_STAGE_LABELS[company.openDeal.stage as CrmDealStage]} ·{" "}
                          {formatGbp(company.openDeal.valueGbp)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.tenantId ? (
                        <Badge variant="secondary">Registered</Badge>
                      ) : (
                        <span className="text-muted-foreground">Prospect</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
