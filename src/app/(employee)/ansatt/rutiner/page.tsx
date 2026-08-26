import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function EmployeeProceduresPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const routines = await prisma.routine.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: "ACTIVE",
    },
    include: {
      responsibleUser: {
        select: { name: true, email: true },
      },
    },
    orderBy: { title: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-indigo-600" />
          Procedures
        </h1>
        <p className="text-muted-foreground text-sm">
          Company procedures and arrangements under HSWA s.2(3). Read and follow
          the procedures relevant to your role.
        </p>
      </div>

      {routines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">No procedures published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <Link key={routine.id} href={`/ansatt/rutiner/${routine.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <ClipboardList className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 truncate">{routine.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                        {routine.category && (
                          <Badge variant="outline" className="text-xs">
                            {routine.category}
                          </Badge>
                        )}
                        {routine.legalReference && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-50 text-blue-700"
                          >
                            {routine.legalReference}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {routine.responsibleUser && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {routine.responsibleUser.name || routine.responsibleUser.email}
                          </span>
                        )}
                        {routine.lastReviewedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last reviewed{" "}
                            {format(new Date(routine.lastReviewedAt), "d MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> If a procedure is out of date or you have
            suggestions, contact your line manager or HSE manager.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
