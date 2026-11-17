"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";

const PAGE_SIZE = 20;

export type OrganisationTableRow = {
  id: string;
  name: string;
  orgNumber: string | null;
  contactEmail: string | null;
  status: string;
  billing: "paid" | "unpaid" | "demo";
  userCount: number;
  lastLogin: string | null;
  subscription: { plan: string; price: number; billingInterval: string } | null;
  agreement: "accepted" | "sent" | null;
  overdueInvoiceCount: number;
  recentIncidents: number;
  recentDocuments: number;
  riskCount: number;
  activityLabel: string;
  activityColor: string;
};

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-GB");
}

export function OrganisationTable({ rows }: { rows: OrganisationTableRow[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = useMemo(
    () => rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [rows, safePage],
  );

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-center">Activity (30d)</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <Link href={`/admin/tenants/${tenant.id}`} className="font-medium hover:underline">
                    {tenant.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{tenant.orgNumber || "No company number"}</p>
                </TableCell>
                <TableCell className="text-sm">{tenant.contactEmail || "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tenant.status === "ACTIVE" ? "default" : tenant.status === "TRIAL" ? "secondary" : "destructive"
                    }
                  >
                    {tenant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tenant.billing === "paid" ? "default" : tenant.billing === "demo" ? "secondary" : "destructive"
                    }
                  >
                    {tenant.billing === "paid" ? "Paid" : tenant.billing === "demo" ? "Demo" : "Unpaid"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {tenant.agreement === "accepted" ? (
                    <Badge variant="default" className="flex w-fit items-center gap-1 bg-green-600 hover:bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Accepted
                    </Badge>
                  ) : tenant.agreement === "sent" ? (
                    <Badge variant="secondary">Sent</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {tenant.subscription ? (
                    <div>
                      <p className="text-sm font-medium">{tenant.subscription.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        £{tenant.subscription.price} / {tenant.subscription.billingInterval === "MONTHLY" ? "mo" : "yr"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{tenant.userCount}</TableCell>
                <TableCell className="text-sm">{formatDate(tenant.lastLogin)}</TableCell>
                <TableCell className="text-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-sm font-medium">{tenant.recentIncidents + tenant.recentDocuments}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tenant.recentIncidents} incidents</p>
                      <p>{tenant.recentDocuments} documents</p>
                      <p>{tenant.riskCount} risks (total)</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Circle className={`h-2.5 w-2.5 fill-current ${tenant.activityColor}`} />
                    <span className={`text-xs font-medium ${tenant.activityColor}`}>{tenant.activityLabel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {tenant.overdueInvoiceCount > 0 ? (
                    <Badge variant="destructive" className="flex w-fit items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {tenant.overdueInvoiceCount} overdue
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">OK</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {rows.length === 0
            ? "No organisations"
            : `${safePage * PAGE_SIZE + 1}–${Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of ${rows.length}`}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
