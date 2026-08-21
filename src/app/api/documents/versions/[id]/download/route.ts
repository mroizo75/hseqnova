import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    // Hent dokument-versjon og sjekk tilgang
    const version = await prisma.documentVersion.findUnique({
      where: { id },
      include: {
        document: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!version || version.document.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Dokumentversjon ikke funnet" },
        { status: 404 }
      );
    }

    // Generer signert URL fra storage
    const storage = getStorage();
    const signedUrl = await storage.getUrl(version.fileKey, 3600); // 1 time

    // Redirect til signert URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Feil ved nedlasting av dokumentversjon:", error);
    return NextResponse.json(
      { error: "Kunne ikke laste ned dokumentversjon" },
      { status: 500 }
    );
  }
}
