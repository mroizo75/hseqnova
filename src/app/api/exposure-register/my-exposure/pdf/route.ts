import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { renderExposureRegisterPDF } from "@/lib/exposure-register-pdf";
import { loadExposuresForEmployee, loadUserNameEmail } from "@/server/queries/exposure-register.queries";
import { getAdminDb } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const [user, entries, tenant] = await Promise.all([
    loadUserNameEmail(session.user.id),
    loadExposuresForEmployee(session.user.tenantId, session.user.id),
    getAdminDb().from("Tenant").select("name").eq("id", session.user.tenantId).maybeSingle(),
  ]);

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const employeeName = user.name ?? user.email ?? "Unknown";
  const companyName = (tenant.data?.name as string | undefined) ?? "Organisation";
  const generatedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  try {
    const pdfBuffer = await renderExposureRegisterPDF({
      employeeName,
      companyName,
      generatedAt,
      entries,
    });

    const safeName = `Health-records-${employeeName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate the PDF";
    return new NextResponse(message, { status: 500 });
  }
}
