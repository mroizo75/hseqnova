import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAdminTenants } from "@/server/queries/admin.queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import Link from "next/link";
import { Plus, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

export default async function TenantsPage() {
  const session = await getServerSession(authOptions);
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin);
  const tenants = await loadAdminTenants();

  const activeCount = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const trialCount = tenants.filter((tenant) => tenant.status === "TRIAL").length;
  const inactiveCount = tenants.filter(
    (tenant) => tenant.activity.level === "inactive" && tenant.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organisations</h1>
          <p className="text-muted-foreground">
            {tenants.length} organisations • {activeCount} active • {trialCount} trial
            {inactiveCount > 0 && (
              <span className="font-medium text-destructive">
                {" "}• {inactiveCount} inactive
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants/new">
            <Plus className="mr-2 h-4 w-4" />
            New organisation
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All organisations ({tenants.length})</CardTitle>
          <CardDescription>
            Click an organisation for details. Activity is based on the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Status</TableHead>
                  {isSuperAdmin && <TableHead>Agreement</TableHead>}
                  {isSuperAdmin && <TableHead>Subscription</TableHead>}
                  {isSuperAdmin && <TableHead className="text-center">Users</TableHead>}
                  {isSuperAdmin && <TableHead>Last sign-in</TableHead>}
                  <TableHead className="text-center">Activity (30d)</TableHead>
                  <TableHead>Engagement</TableHead>
                  {isSuperAdmin && <TableHead>Invoice</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="-m-4 block p-4"
                      >
                        <p className="font-medium hover:underline">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.orgNumber || tenant.slug}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tenant.status === "ACTIVE"
                            ? "default"
                            : tenant.status === "TRIAL"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        {(() => {
                          const latestOffer = tenant.offers[0];
                          const isAccepted =
                            latestOffer?.status === "ACCEPTED" ||
                            (tenant.status === "ACTIVE" && !latestOffer);
                          if (isAccepted) {
                            return (
                              <Badge
                                variant="default"
                                className="flex w-fit items-center gap-1 bg-green-600 hover:bg-green-600"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Accepted
                              </Badge>
                            );
                          }
                          if (latestOffer?.status === "SENT") {
                            return <Badge variant="secondary">Sent</Badge>;
                          }
                          return <span className="text-sm text-muted-foreground">-</span>;
                        })()}
                      </TableCell>
                    )}
                    {isSuperAdmin && (
                      <TableCell>
                        {tenant.subscription ? (
                          <div>
                            <p className="text-sm font-medium">{tenant.subscription.plan}</p>
                            <p className="text-xs text-muted-foreground">
                              {tenant.subscription.price} /
                              {tenant.subscription.billingInterval === "MONTHLY" ? "mo" : "yr"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {isSuperAdmin && (
                      <TableCell className="text-center">{tenant.userCount}</TableCell>
                    )}
                    {isSuperAdmin && (
                      <TableCell>
                        {tenant.lastLogin ? (
                          <div>
                            <p className="text-sm">
                              {tenant.lastLogin.toLocaleDateString("en-GB")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDaysAgo(tenant.lastLogin)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center justify-center gap-1.5 text-sm">
                            <span className="font-medium">
                              {tenant.recentIncidents + tenant.recentDocuments}
                            </span>
                          </div>
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
                        <Circle
                          className={`h-2.5 w-2.5 fill-current ${tenant.activity.color}`}
                        />
                        <span className={`text-xs font-medium ${tenant.activity.color}`}>
                          {tenant.activity.label}
                        </span>
                      </div>
                    </TableCell>
                    {isSuperAdmin && (
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDaysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
