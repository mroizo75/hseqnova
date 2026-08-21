import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TenantSelector } from "@/components/auth/tenant-selector";

export default async function SelectTenantPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      tenants: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              employeeCount: true,
              industry: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Hvis brukeren bare har én tenant, redirect direkte
  if (user.tenants.length === 1) {
    redirect("/dashboard");
  }

  // Hvis brukeren ikke har noen tenants, vis feilmelding
  if (user.tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-4">Ingen tilgang</h1>
          <p className="text-center text-muted-foreground">
            Du har ikke tilgang til noen bedrifter. Kontakt support for hjelp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <TenantSelector
        userId={user.id}
        tenants={user.tenants.map((ut) => ({
          id: ut.tenant.id,
          name: ut.tenant.name,
          slug: ut.tenant.slug,
          status: ut.tenant.status,
          role: ut.role,
          employeeCount: ut.tenant.employeeCount,
          industry: ut.tenant.industry,
        }))}
        lastTenantId={user.lastTenantId}
      />
    </div>
  );
}
