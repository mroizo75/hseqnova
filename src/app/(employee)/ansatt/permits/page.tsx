import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileKey } from "lucide-react";
import Link from "next/link";
import { listWorkforcePermits } from "@/server/actions/permit-to-work.actions";
import { PermitLegalNote } from "@/features/permits/components/permit-legal-note";
import { permitTypeLabel } from "@/lib/permit-uk";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ISSUED: { label: "Live", variant: "default" },
  CLOSED: { label: "Closed", variant: "outline" },
};

export default async function EmployeePermitsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  let permits: Awaited<ReturnType<typeof listWorkforcePermits>> = [];
  try {
    permits = await listWorkforcePermits();
  } catch {
    permits = [];
  }

  const live = permits.filter((row) => row.status === "ISSUED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FileKey className="h-7 w-7" />
          Permits to work
        </h1>
        <p className="text-muted-foreground">
          Live and recently closed permits — the written safe system for the job
        </p>
      </div>

      <PermitLegalNote />

      <Card>
        <CardHeader>
          <CardTitle>Permits in force ({live.length} live)</CardTitle>
        </CardHeader>
        <CardContent>
          {permits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No issued permits at the moment.
            </p>
          ) : (
            <div className="space-y-3">
              {permits.map((permit) => {
                const style = STATUS_STYLES[permit.status] ?? STATUS_STYLES.CLOSED;
                return (
                  <Link
                    key={permit.id}
                    href={`/ansatt/permits/${permit.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{permit.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {permitTypeLabel(permit.type)}
                          {permit.location ? ` · ${permit.location}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Valid to{" "}
                          {permit.validTo
                            ? new Date(permit.validTo).toLocaleString("en-GB")
                            : "—"}
                        </p>
                      </div>
                      <Badge variant={style.variant}>{style.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
