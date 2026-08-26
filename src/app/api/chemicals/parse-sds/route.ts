import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { parseSDSFile } from "@/lib/sds-parser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { sdsKey } = await req.json();

    if (!sdsKey) {
      return NextResponse.json({ error: "sdsKey is required" }, { status: 400 });
    }

    const storage = getStorage();
    const fileBuffer = await storage.get(sdsKey);

    if (!fileBuffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const extractedData = await parseSDSFile(fileBuffer);

    const responseData = {
      productName: extractedData.productName,
      supplier: extractedData.supplier,
      casNumber: extractedData.casNumber || extractedData.casNumbers?.[0],
      hazardStatements: typeof extractedData.hazardStatements === "string"
        ? extractedData.hazardStatements
        : extractedData.hazardStatements?.join(", "),
      warningPictograms: extractedData.warningPictograms
        ? JSON.stringify(extractedData.warningPictograms)
        : undefined,
      requiredPPE: extractedData.requiredPPE
        ? JSON.stringify(extractedData.requiredPPE)
        : undefined,
      containsIsocyanates: extractedData.containsIsocyanates,
      isocyanateDetails: extractedData.isocyanateDetails,
      confidence: extractedData.confidence,
      sdsKey,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not parse the safety data sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
