import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminUserForm } from "@/features/admin/components/admin-user-form";
import { loadAdminTenantOptions } from "@/server/queries/admin.queries";

export default async function NewAdminUserPage() {
  const tenants = await loadAdminTenantOptions();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to users
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New user</h1>
        <p className="text-muted-foreground">
          Create a user and link them to an organisation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User details</CardTitle>
          <CardDescription>
            Enter the new user's details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserForm tenants={tenants} />
        </CardContent>
      </Card>
    </div>
  );
}
