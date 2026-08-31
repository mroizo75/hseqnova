import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Beaker } from "lucide-react";
import { StoffkartotekClient } from "./stoffkartotek-client";
import { loadChemicalsForTenant } from "@/server/queries/chemicals.queries";
import { CoshhLegalNote } from "@/features/chemicals/components/coshh-legal-note";

export default async function AnsattStoffkartotek() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("employeeChemicalsPage");

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const chemicals = (await loadChemicalsForTenant(session.user.tenantId, { status: "ACTIVE" }))
    .slice()
    .sort((a, b) => a.productName.localeCompare(b.productName, "en-GB"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Beaker className="h-7 w-7 text-purple-600" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <CoshhLegalNote />

      <Card className="border-l-4 border-l-orange-500 bg-orange-50">
        <CardContent className="p-4">
          <p className="text-sm text-orange-900">
            <strong>{t("sdsNotice.title")}</strong> {t("sdsNotice.description")}
          </p>
        </CardContent>
      </Card>

      <StoffkartotekClient chemicals={chemicals} />
    </div>
  );
}
