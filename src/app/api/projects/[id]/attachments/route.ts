import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateFileKey, getStorage } from "@/lib/storage";
import { insertProjectAttachment, loadProjectById } from "@/server/queries/projects.queries";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId;

    if (!session?.user || !tenantId) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Unauthorised" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const project = await loadProjectById(projectId, tenantId);

    if (!project) {
      return NextResponse.json(
        { code: "PROJECT_NOT_FOUND", message: "Project not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry) => entry instanceof File) as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { code: "NO_FILES", message: "No files were sent" },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const created = [];

    for (const file of files) {
      if (file.size === 0) {
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            code: "FILE_TOO_LARGE",
            message: `The file "${file.name}" exceeds the 50 MB limit`,
          },
          { status: 400 }
        );
      }

      const fileKey = generateFileKey(tenantId, `projects/${projectId}/attachments`, file.name);
      await storage.upload(fileKey, file);
      try {
        // HSWA 1974 s.2 — documented organisation and arrangements for the site.
        const attachment = await insertProjectAttachment({
          tenantId,
          projectId,
          fileKey,
          name: file.name,
          mime: file.type || "application/octet-stream",
          size: file.size,
        });
        created.push(attachment);
      } catch (error) {
        await storage.delete(fileKey);
        throw error;
      }
    }

    return NextResponse.json({
      code: "OK",
      message: "Attachments uploaded",
      attachments: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: "UPLOAD_FAILED",
        message: "Could not upload attachments",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
