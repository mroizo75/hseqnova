import { requireEnterpriseAccess } from "@/lib/enterprise-context";
import { loadEnterpriseAlerts } from "@/server/queries/enterprise.queries";
import { AcknowledgeAlertButton } from "@/features/enterprise/components/acknowledge-alert-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AlertsPage() {
  const ctx = await requireEnterpriseAccess();
  const alerts = await loadEnterpriseAlerts(ctx);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts</h1>
        <p className="text-muted-foreground">High-level signals only. No personal or incident detail.</p>
      </div>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">No alerts.</CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{alert.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{alert.summary}</p>
                </div>
                <Badge variant={alert.severity === "CRITICAL" ? "destructive" : "secondary"}>
                  {alert.severity}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {alert.acknowledgedAt ? "Acknowledged" : new Date(alert.createdAt).toLocaleString("en-GB")}
                </p>
                {!alert.acknowledgedAt ? (
                  <AcknowledgeAlertButton id={alert.id} canManage={ctx.permissions.canManageAlerts} />
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
