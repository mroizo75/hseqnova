import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canProvisionEnterprise } from "@/lib/platform-access";
import { getAdminDb } from "@/lib/supabase/admin";
import { ProvisionEnterpriseForm } from "@/features/enterprise/components/provision-enterprise-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminEnterprisesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canProvisionEnterprise(session.user)) {
    redirect("/admin");
  }
  const { data } = await getAdminDb()
    .from("EnterpriseOrganisation")
    .select("id, name, slug, type, status, analyticsEnabled, benchmarkEnabled, createdAt")
    .order("createdAt", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enterprise organisations</h1>
        <p className="text-muted-foreground">
          Only HSEQ Nova staff can create a group, insurer or network here. Customers cannot self-serve this.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Provision</CardTitle>
          <CardDescription>Creates the organisation, a default portfolio, two starter standards and an owner login.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProvisionEnterpriseForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Existing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {((data ?? []) as Array<Record<string, unknown>>).map((row) => (
            <div key={String(row.id)} className="flex justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="font-medium">{String(row.name)}</p>
                <p className="text-muted-foreground">
                  {String(row.type)} · {String(row.status)}
                  {row.analyticsEnabled ? " · Analytics" : ""}
                  {row.benchmarkEnabled ? " · Intelligence" : ""}
                </p>
              </div>
              <span className="text-muted-foreground">{String(row.slug)}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-muted-foreground">
            Customer users sign in at <Link className="underline" href="/enterprise">/enterprise</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
