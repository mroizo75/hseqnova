import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  findCourseTemplateByTenantKey,
  findCourseTemplateForTenant,
  insertCourseTemplate,
  updateCourseTemplateRecord,
} from "@/server/queries/training.queries";

const courseTemplateSchema = z.object({
  courseKey: z.string().min(1, "Course code is required"),
  title: z.string().min(1, "Course title is required"),
  description: z.string().nullable().optional(),
  provider: z.string().nullable().optional(),
  isRequired: z.boolean().default(false),
  validityYears: z.number().int().min(1).max(10).nullable().optional(),
});

const updateCourseTemplateSchema = courseTemplateSchema.extend({
  id: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = courseTemplateSchema.parse(body);

    const existing = await findCourseTemplateByTenantKey(session.user.tenantId, data.courseKey);
    if (existing) {
      return NextResponse.json(
        { error: "A course template with this course code already exists" },
        { status: 400 },
      );
    }

    const courseTemplate = await insertCourseTemplate({
      tenantId: session.user.tenantId,
      courseKey: data.courseKey,
      title: data.title,
      description: data.description,
      provider: data.provider,
      isRequired: data.isRequired,
      validityYears: data.validityYears,
    });

    return NextResponse.json(courseTemplate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not create course template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateCourseTemplateSchema.parse(body);

    const existing = await findCourseTemplateForTenant(data.id, session.user.tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Course template not found" }, { status: 404 });
    }

    const courseTemplate = await updateCourseTemplateRecord(data.id, session.user.tenantId, {
      title: data.title,
      description: data.description,
      provider: data.provider,
      isRequired: data.isRequired,
      validityYears: data.validityYears,
    });

    return NextResponse.json(courseTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not update course template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await findCourseTemplateForTenant(id, session.user.tenantId);
    if (!existing) {
      return NextResponse.json({ error: "Course template not found" }, { status: 404 });
    }

    await updateCourseTemplateRecord(id, session.user.tenantId, { isActive: false });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not delete course template" }, { status: 500 });
  }
}
