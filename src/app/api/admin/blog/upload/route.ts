import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "hmsnova";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isSuperAdmin) {
      return errorResponse("UNAUTHORISED", "Unauthorised", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return errorResponse("NO_FILE", "No file was uploaded", 400);
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type || "application/octet-stream";
    const extension = EXTENSION_BY_TYPE[fileType];

    if (!extension) {
      return errorResponse("INVALID_TYPE", "Only JPEG, PNG, WebP and GIF images are allowed", 400);
    }

    if (fileBuffer.length > MAX_BYTES) {
      return errorResponse("FILE_TOO_LARGE", "The image is too large. The maximum size is 5 MB", 400);
    }

    const baseName = (file.name || "image")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
    const key = `blog/images/${Date.now()}-${baseName}.${extension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType,
      })
    );

    // Stable public route instead of an expiring signed URL (blog/images/* is public in /api/files).
    const url = `/api/files/${key}`;

    return NextResponse.json({
      url,
      key,
      success: true,
    });
  } catch (error) {
    console.error("[Blog Upload] Error:", error);
    return errorResponse("UPLOAD_FAILED", "Image upload failed", 500);
  }
}
