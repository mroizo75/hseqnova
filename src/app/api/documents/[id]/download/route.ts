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

    // Hent dokument og sjekk tilgang
    const document = await prisma.document.findUnique({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Dokument ikke funnet" }, { status: 404 });
    }

    // Generer signert URL fra storage
    const storage = getStorage();
    const signedUrl = await storage.getUrl(document.fileKey, 3600); // 1 time

    // Redirect til signert URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Feil ved nedlasting av dokument:", error);
    return NextResponse.json(
      { error: "Kunne ikke laste ned dokument" },
      { status: 500 }
    );
  }
}
