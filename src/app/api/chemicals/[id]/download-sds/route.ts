import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

/**
 * Proxier SDS-fil fra R2 til klienten for å unngå CORS (browser får ikke
 * tilgang til signert R2-URL direkte fra www.hmsnova.no).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Ikke autorisert" },
        { status: 401 }
      );
    }

    const chemical = await prisma.chemical.findUnique({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!chemical) {
      return NextResponse.json(
        { error: "Kjemikalie ikke funnet" },
        { status: 404 }
      );
    }

    if (!chemical.sdsKey) {
      return NextResponse.json(
        { error: "Sikkerhetsdatablad mangler" },
        { status: 404 }
      );
    }

    const storage = getStorage();
    const buffer = await storage.get(chemical.sdsKey);

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: "Sikkerhetsdatablad ikke funnet i lagring" },
        { status: 404 }
      );
    }

    const filename =
      chemical.productName.replace(/[^a-zA-Z0-9-_ .]/g, "_").slice(0, 80) +
      "-sds.pdf";

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Feil ved nedlasting av SDS:", error);
    return NextResponse.json(
      { error: "Kunne ikke laste ned sikkerhetsdatablad" },
      { status: 500 }
    );
  }
}

