import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase/admin";
import { createIncident } from "@/server/actions/incident.actions";
import { getStorage, generateFileKey } from "@/lib/storage";
import { createNotification } from "@/server/actions/notification.actions";
import { createId } from "@/lib/ids";
import { IncidentType } from "@prisma/client";

const allowedEmployeeIncidentTypes: IncidentType[] = [
  "ULYKKE",
  "NESTEN",
  "FARLIG_SITUASJON",
  "YRKESSYKDOM",
  "AVVIK",
  "HMS",
  "MILJO",
  "KVALITET",
  "CUSTOMER",
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const db = getAdminDb();
    let tenantId = session.user.tenantId ?? null;
    if (!tenantId) {
      const { data: membership } = await db
        .from("UserTenant")
        .select("tenantId")
        .eq("userId", session.user.id)
        .maybeSingle();
      tenantId = membership?.tenantId ?? null;
    }
    if (!tenantId) {
      return NextResponse.json({ error: "No organisation access" }, { status: 403 });
    }

    const description = (formData.get("description") as string | null)?.trim() ?? "";
    const type = (formData.get("type") as string | null)?.trim() ?? "";
    const severityStr = (formData.get("severity") as string | null)?.trim() || null;
    const severity = severityStr ? parseInt(severityStr, 10) : null;
    const location = (formData.get("location") as string | null)?.trim() ?? "";
    const occurredAtRaw = (formData.get("occurredAt") as string | null)?.trim() ?? "";
    const date = formData.get("date") as string;
    const contextDetails = (formData.get("contextDetails") as string | null)?.trim() || null;
    const enrichedDescription = contextDetails
      ? `${description}\n\nContext note: ${contextDetails}`
      : description;
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date(date);
    const { titleFromDescription } = await import("@/lib/accident-book");
    const title =
      (formData.get("title") as string | null)?.trim() || titleFromDescription(enrichedDescription);
    const accidentBookTypes = new Set(["ULYKKE", "NESTEN", "FARLIG_SITUASJON", "YRKESSYKDOM", "SKADE"]);

    if (!description || !type) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (accidentBookTypes.has(type) && !location) {
      return NextResponse.json({ error: "Place of accident is required." }, { status: 400 });
    }
    if (!allowedEmployeeIncidentTypes.includes(type as IncidentType)) {
      return NextResponse.json({ error: "Invalid incident type." }, { status: 400 });
    }
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Invalid date and time." }, { status: 400 });
    }

    const rawSubcategoryKeys = formData.get("subcategoryKeys") as string | null;
    let subcategoryKeys: string[] = [];
    if (rawSubcategoryKeys && rawSubcategoryKeys.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(rawSubcategoryKeys) as unknown;
        if (Array.isArray(parsed)) {
          subcategoryKeys = parsed.filter((value): value is string => typeof value === "string");
        }
      } catch {
        subcategoryKeys = [];
      }
    }

    const result = await createIncident({
      tenantId,
      type,
      title,
      description: enrichedDescription,
      severity,
      occurredAt: occurredAt.toISOString(),
      reportedBy: session.user.id,
      location,
      witnessName: formData.get("witnessName") as string | null,
      injuryType: formData.get("injuryType") as string | null,
      medicalAttentionRequired: formData.get("medicalAttentionRequired") === "yes",
      lostTimeMinutes: formData.get("lostTimeMinutes")
        ? Number(formData.get("lostTimeMinutes"))
        : undefined,
      involvedPersons: formData.get("involvedPersons") as string | null,
      customerName: formData.get("customerName") as string | null,
      customerEmail: formData.get("customerEmail") as string | null,
      customerPhone: formData.get("customerPhone") as string | null,
      customerTicketId: formData.get("customerTicketId") as string | null,
      responseDeadline: formData.get("responseDeadline") as string | null,
      customerSatisfaction: formData.get("customerSatisfaction")
        ? Number(formData.get("customerSatisfaction"))
        : undefined,
      projectId: (formData.get("projectId") as string | null) || undefined,
      projectReference: formData.get("projectReference") as string | null,
      injuredPersonOccupation: formData.get("injuredPersonOccupation") as string | null,
      injuredPersonAddress: formData.get("injuredPersonAddress") as string | null,
      injuredPersonRole: formData.get("injuredPersonRole") as string | null,
      witnessAddress: formData.get("witnessAddress") as string | null,
      shareWithSafetyRepsConsent: formData.get("shareWithSafetyRepsConsent") === "true",
      reporterAcknowledged: formData.get("reporterAcknowledged") === "true",
      nonWorkerTakenToHospital: formData.get("nonWorkerTakenToHospital") === "true",
      specifiedInjury: formData.get("specifiedInjury") === "true",
      listedOccupationalDisease: formData.get("listedOccupationalDisease") === "true",
      listedDangerousOccurrence: formData.get("listedDangerousOccurrence") === "true",
      subcategoryKeys,
    });

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "Could not record incident" }, { status: 400 });
    }

    const incident = result.data;
    const images = formData.getAll("images") as File[];
    const storage = getStorage();

    for (const image of images) {
      if (image && image.size > 0) {
        const fileKey = generateFileKey(tenantId, "incidents", image.name);
        await storage.upload(fileKey, image);
        await db.from("Attachment").insert({
          id: createId(),
          tenantId,
          incidentId: incident.id,
          fileKey,
          name: image.name,
          mime: image.type,
          size: image.size,
        });
      }
    }

    void createNotification({
      tenantId,
      userId: session.user.id,
      type: "NEW_INCIDENT",
      title: "Incident received",
      message: `Thank you. Your accident book entry "${title}" has been recorded and will be handled by the competent person.`,
      link: `/ansatt/avvik`,
    }).catch(() => {});

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
