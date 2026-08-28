import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemSettingsForm } from "@/features/admin/components/system-settings-form";
import { EmailSettingsForm } from "@/features/admin/components/email-settings-form";
import { StorageSettingsForm } from "@/features/admin/components/storage-settings-form";
import { PaymentSettingsForm } from "@/features/admin/components/payment-settings-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser;

  if (!user?.isSuperAdmin) {
    redirect("/admin");
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System settings</h1>
        <p className="text-muted-foreground">
          Configure system, email, storage and payment services
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System settings</CardTitle>
              <CardDescription>
                General settings for HSEQ Nova
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email settings</CardTitle>
              <CardDescription>
                Configure Resend for transactional emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage settings</CardTitle>
              <CardDescription>
                Configure Cloudflare R2 or S3 for file storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StorageSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment settings</CardTitle>
              <CardDescription>
                Configure Stripe for billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
