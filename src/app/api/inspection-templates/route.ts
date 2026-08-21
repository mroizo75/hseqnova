import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ templates: [] }, { status: 200 });
    }

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId: session.user.id },
    });

    if (!userTenant) {
      return NextResponse.json({ templates: [] }, { status: 200 });
    }

    const templates = await prisma.inspectionTemplate.findMany({
      where: {
        OR: [
          { tenantId: userTenant.tenantId },
          { tenantId: null, isGlobal: true },
        ],
      },
      orderBy: [{ isGlobal: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[InspectionTemplates] error", error);
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
}

