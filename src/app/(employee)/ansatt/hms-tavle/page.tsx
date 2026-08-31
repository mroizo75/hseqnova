import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  Phone,
  MapPin,
  Shield,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type BoardSection = {
  id: string;
  tavleId: string;
  isVisible: boolean;
  title: string | null;
  type: string;
};

type BoardLink = {
  id: string;
  tavleId: string;
  url: string;
  title: string | null;
};

export default async function EmployeeSafetyBoardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  const db = getAdminDb();
  const [boardsRes, tenantRes] = await Promise.all([
    db
      .from("HmsTavle")
      .select("id, name, siteAddress")
      .eq("tenantId", tenantId)
      .order("name", { ascending: true }),
    db
      .from("Tenant")
      .select("hmsContactName, hmsContactPhone, hmsContactEmail")
      .eq("id", tenantId)
      .maybeSingle(),
  ]);

  const boardRows = boardsRes.data ?? [];
  const boardIds = boardRows.map((row) => row.id);
  const [sectionsRes, linksRes] = boardIds.length
    ? await Promise.all([
        db.from("HmsTavleSection").select("*").in("tavleId", boardIds).order("order", { ascending: true }),
        db.from("HmsTavleExternalLink").select("*").in("tavleId", boardIds),
      ])
    : [{ data: [] as Array<Record<string, unknown>> }, { data: [] as Array<Record<string, unknown>> }];

  const boards = boardRows.map((board) => ({
    ...board,
    sections: ((sectionsRes.data ?? []) as BoardSection[]).filter((section) => section.tavleId === board.id),
    externalLinks: ((linksRes.data ?? []) as BoardLink[]).filter((link) => link.tavleId === board.id),
  }));
  const tenant = tenantRes.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <LayoutDashboard className="h-7 w-7 text-cyan-600" />
          Safety Board
        </h1>
        <p className="text-muted-foreground text-sm">
          Digital safety information board for your workplace. Quick access to
          safety contacts, procedures and site information.
        </p>
      </div>

      {tenant?.hmsContactName && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-red-600" />
              Emergency contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Emergency services</span>
              <a href="tel:999" className="text-red-600 font-bold">
                999
              </a>
            </div>
            <div className="flex justify-between text-sm">
              <span>HSE manager</span>
              <span className="font-medium">{tenant.hmsContactName}</span>
            </div>
            {tenant.hmsContactPhone && (
              <div className="flex justify-between text-sm">
                <span>Phone</span>
                <a
                  href={`tel:${tenant.hmsContactPhone}`}
                  className="text-primary font-bold"
                >
                  {tenant.hmsContactPhone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/ansatt/avvik/ny">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Shield className="h-8 w-8 text-red-600" />
              <p className="text-sm font-medium">Report incident</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/ansatt/dokumenter">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <p className="text-sm font-medium">Documents</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {boards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground text-sm">
              No safety boards have been set up yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        boards.map((board) => (
          <Card key={board.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-cyan-600" />
                {board.name}
              </CardTitle>
              {board.siteAddress && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {board.siteAddress}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {board.sections
                .filter((s) => s.isVisible)
                .map((section) => (
                <div
                  key={section.id}
                  className="bg-gray-50 rounded-lg p-3 space-y-1"
                >
                  <p className="text-sm font-medium">{section.title ?? section.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {section.type.replace(/_/g, " ")}
                  </p>
                </div>
              ))}

              {board.externalLinks.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Useful links
                  </p>
                  {board.externalLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              )}

              {board.sections.filter((s) => s.isVisible).length === 0 &&
                board.externalLinks.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No content added to this board yet.
                  </p>
                )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
