import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { loadTrainingById } from "@/server/queries/training.queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const training = await loadTrainingById({ id, tenantId: session.user.tenantId });
    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 });
    }

    if (!training.proofDocKey) {
      return NextResponse.json({ error: "No certificate has been uploaded" }, { status: 404 });
    }

    const storage = getStorage();
    const url = await storage.getUrl(training.proofDocKey, 3600);

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Could not load the certificate" }, { status: 500 });
  }
}
