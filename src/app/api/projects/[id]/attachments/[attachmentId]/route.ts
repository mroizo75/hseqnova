import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { deleteProjectAttachment, loadProjectAttachment } from "@/server/queries/projects.queries";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
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

    const { id: projectId, attachmentId } = await params;
    const attachment = await loadProjectAttachment(attachmentId, projectId, tenantId);

    if (!attachment) {
      return NextResponse.json(
        { code: "ATTACHMENT_NOT_FOUND", message: "Attachment not found" },
        { status: 404 }
      );
    }

    const storage = getStorage();
    await storage.delete(attachment.fileKey);
    await deleteProjectAttachment(attachment.id);

    return NextResponse.json({
      code: "OK",
      message: "Attachment deleted",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: "DELETE_FAILED",
        message: "Could not delete the attachment",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
