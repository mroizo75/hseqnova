import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserForm } from "@/features/admin/components/admin-user-form";
import { loadAdminTenantOptions, loadAdminUserEditor } from "@/server/queries/admin.queries";
import type { Role } from "@prisma/client";

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, tenants] = await Promise.all([
    loadAdminUserEditor(id),
    loadAdminTenantOptions(),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to users
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit user</h1>
        <p className="text-muted-foreground">
          Update user details and access
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User details</CardTitle>
          <CardDescription>
            Edit this user's information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserForm
            tenants={tenants}
            user={{
              ...user,
              tenants: user.tenants.map((membership) => ({
                tenantId: membership.tenantId,
                role: membership.role as Role,
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
