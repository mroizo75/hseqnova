import { redirect } from "next/navigation";
import { EmailTestPanel } from "@/features/settings/components/email-test-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Mail, TestTube, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { loadMembership, loadSettingsUser, loadTenantWithSubscription } from "@/server/queries/settings.queries";

export const metadata = { title: "Test notifications" };

export default async function TestNotificationsPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }
  if (!auth.permissions.canReadSettings) {
    redirect("/dashboard");
  }

  const [user, membership, tenant] = await Promise.all([
    loadSettingsUser(auth.userId),
    loadMembership(auth.userId, auth.tenantId),
    loadTenantWithSubscription(auth.tenantId),
  ]);

  if (!user || !membership || !tenant) {
    return <div>No access to organisation</div>;
  }

  const { data: memberships } = await getAdminDb()
    .from("UserTenant")
    .select("userId, notifyByEmail, notifyBySms, phone")
    .eq("tenantId", auth.tenantId);

  const userIds = (memberships ?? []).map((row) => row.userId as string);
  const { data: users } = userIds.length
    ? await getAdminDb().from("User").select("id, name, email, phone").in("id", userIds)
    : { data: [] as Array<{ id: string; name: string | null; email: string; phone: string | null }> };

  const userById = new Map((users ?? []).map((row) => [row.id as string, row]));
  const tenantUsers = (memberships ?? []).flatMap((row) => {
    const member = userById.get(row.userId as string);
    if (!member) return [];
    return [
      {
        id: member.id as string,
        name: (member.name as string | null) ?? null,
        email: member.email as string,
        notifyByEmail: Boolean(row.notifyByEmail),
        notifyBySms: Boolean(row.notifyBySms),
        phone: (row.phone as string | null) ?? (member.phone as string | null) ?? null,
      },
    ];
  });

  const isResendConfigured = !!process.env.RESEND_API_KEY;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard/settings">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to settings
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Test email notifications</h1>
          <p className="text-muted-foreground">
            Send test emails to verify that notifications work
          </p>
        </div>
      </div>

      {!isResendConfigured && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Resend is not configured</AlertTitle>
          <AlertDescription>
            RESEND_API_KEY is not set in the environment. Emails will not be sent.
            <br />
            Add <code className="bg-muted px-1 py-0.5 rounded">RESEND_API_KEY=your_api_key</code> to the .env file.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Email configuration</CardTitle>
              <CardDescription>
                Current email setup for {tenant.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">From address</p>
              <p className="text-sm font-mono">
                {process.env.RESEND_FROM_EMAIL ?? "noreply@hseqnova.co.uk"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-sm">
                {isResendConfigured ? (
                  <span className="text-green-600 font-medium">✓ Configured</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Not configured</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Number of users</p>
              <p className="text-sm">{tenantUsers.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active email notifications</p>
              <p className="text-sm">
                {tenantUsers.filter((u) => u.notifyByEmail).length} of {tenantUsers.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EmailTestPanel
        currentUser={{
          id: user.id,
          email: user.email,
          name: user.name,
          notifyByEmail: membership.notifyByEmail,
        }}
        tenantUsers={tenantUsers}
        tenantId={auth.tenantId}
        tenantName={tenant.name}
      />
    </div>
  );
}
