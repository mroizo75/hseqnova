import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { loadEnvironmentGoals, loadEnvironmentUsers } from "@/server/queries/environment.queries";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnvironmentAspectForm } from "@/features/environment/components/environment-aspect-form";

export default async function NewEnvironmentAspectPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/login");
  }

  const [users, goals] = await Promise.all([
    loadEnvironmentUsers(auth.tenantId),
    loadEnvironmentGoals(auth.tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/environment">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New environmental aspect</h1>
          <p className="text-muted-foreground">
            Record environmental impact in accordance with ISO 14001
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EnvironmentAspectForm
            tenantId={auth.tenantId}
            users={users}
            goals={goals}
            defaultOwnerId={auth.userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
