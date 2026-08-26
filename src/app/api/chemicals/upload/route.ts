import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateFileKey } from "@/lib/storage";
import { validatePdfFile, validateFileSize } from "@/lib/file-validation";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hmsnova";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No organisation is linked to this session" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }

    const sizeValidation = validateFileSize(file.size, 10);
    if (!sizeValidation.isValid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name || "unknown.pdf";

    const fileValidation = await validatePdfFile(fileBuffer);
    if (!fileValidation.isValid) {
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }

    const key = generateFileKey(tenantId, "chemicals/sds", fileName);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: fileValidation.detectedType || "application/pdf",
      }),
    );

    return NextResponse.json({
      key,
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "File upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
