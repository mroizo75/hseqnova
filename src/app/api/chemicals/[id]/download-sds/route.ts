import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { loadChemicalById } from "@/server/queries/chemicals.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const chemical = await loadChemicalById(id, session.user.tenantId);

    if (!chemical) {
      return NextResponse.json({ error: "Chemical not found" }, { status: 404 });
    }

    if (!chemical.sdsKey) {
      return NextResponse.json({ error: "Safety data sheet is missing" }, { status: 404 });
    }

    const storage = getStorage();
    const buffer = await storage.get(chemical.sdsKey);

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "Safety data sheet not found in storage" }, { status: 404 });
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
    const message =
      error instanceof Error ? error.message : "Could not download the safety data sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
