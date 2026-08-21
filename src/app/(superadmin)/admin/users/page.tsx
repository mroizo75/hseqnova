import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield, Building2 } from "lucide-react";
import Link from "next/link";
import { AdminUserList } from "@/features/admin/components/admin-user-list";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionUser } from "@/types";

const ITEMS_PER_PAGE = 20;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser;

  // Kun superadmin har tilgang
  if (!user?.isSuperAdmin) {
    redirect("/admin");
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const searchTerm = params.search || "";

  // Bygg søkefilter (MySQL bruker contains uten mode parameter)
  const searchFilter = searchTerm
    ? {
        OR: [
          { email: { contains: searchTerm } },
          { name: { contains: searchTerm } },
          {
            tenants: {
              some: {
                tenant: {
                  name: { contains: searchTerm },
                },
              },
            },
          },
        ],
      }
    : {};

  // Tell totalt antall brukere (med filter)
  const totalUsers = await prisma.user.count({
    where: searchFilter,
  });

  // Hent brukere med paginering (og filter)
  const users = await prisma.user.findMany({
    where: searchFilter,
    include: {
      tenants: {
        include: {
          tenant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  const stats = {
    total: users.length,
    superAdmins: users.filter((u) => u.isSuperAdmin).length,
    withTenants: users.filter((u) => u.tenants.length > 0).length,
    withoutTenants: users.filter((u) => u.tenants.length === 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brukere</h1>
          <p className="text-muted-foreground">
            Administrer alle brukere på tvers av bedrifter
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Ny bruker
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt brukere</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superadmins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.superAdmins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Med tenant</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.withTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uten tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.withoutTenants}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle brukere</CardTitle>
          <CardDescription>
            Oversikt over alle brukere i systemet • Side {currentPage} av {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserList 
            users={users} 
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}

