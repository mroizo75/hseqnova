import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDb } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Lock, Info } from "lucide-react";
import { WhistleblowingForm } from "./whistleblowing-form";

export default async function WhistleblowingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const { data: tenant } = await getAdminDb()
    .from("Tenant")
    .select("id, slug, name")
    .eq("id", session.user.tenantId)
    .maybeSingle();

  if (!tenant) {
    redirect("/ansatt");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-amber-600" />
          Whistleblowing
        </h1>
        <p className="text-muted-foreground text-sm">
          Report concerns about wrongdoing in your workplace. Protected under
          the Public Interest Disclosure Act 1998 (PIDA).
        </p>
      </div>

      <Card className="border-l-4 border-l-amber-500 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">Your report is confidential</p>
              <p>
                You can submit anonymously. Reports are handled by senior
                management only. You are legally protected against dismissal or
                detriment for raising genuine concerns (PIDA 1998, s.43B–43H).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <WhistleblowingForm tenantId={tenant.id} tenantSlug={tenant.slug} />

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            What counts as a qualifying disclosure?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-1">
          <p>A criminal offence has been, is being, or is likely to be committed</p>
          <p>A legal obligation has been, is being, or is likely to be breached</p>
          <p>A miscarriage of justice has occurred or is likely to occur</p>
          <p>The health or safety of any individual has been or is likely to be endangered</p>
          <p>The environment has been, is being, or is likely to be damaged</p>
          <p>Information relating to any of the above has been or is likely to be concealed</p>
        </CardContent>
      </Card>
    </div>
  );
}
