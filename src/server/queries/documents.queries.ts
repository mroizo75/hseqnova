import { getAdminDb } from "@/lib/supabase/admin";
import type { Document, DocumentTemplate, DocumentVersion, DocumentSignature } from "@prisma/client";

export type DocumentListPerson = { id: string; name: string | null; email: string | null };
export type DocumentListTemplate = { id: string; name: string };

export type DocumentListItem = Document & {
  owner: DocumentListPerson | null;
  template: DocumentListTemplate | null;
};

export type DocumentFormUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type DocumentFormTemplate = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  defaultReviewIntervalMonths: number;
  isGlobal: boolean;
  pdcaGuidance: Record<string, string> | null;
};

export type DocumentDetail = Document & {
  template: DocumentTemplate | null;
  versions: DocumentVersion[];
  signatures: Array<
    DocumentSignature & {
      signedBy: { id: string; name: string | null; email: string | null } | null;
    }
  >;
  approvedByUser: { name: string | null; email: string | null } | null;
  owner: { name: string | null; email: string | null } | null;
};

function asDocument(row: Record<string, unknown>): Document {
  return row as unknown as Document;
}

export async function loadDocumentsForList(tenantId: string): Promise<DocumentListItem[]> {
  const db = getAdminDb();
  const { data: rows, error } = await db
    .from("Document")
    .select("*")
    .eq("tenantId", tenantId)
    .order("createdAt", { ascending: false });

  if (error) {
    throw { code: "DOCUMENT_LIST_FAILED", message: error.message };
  }

  const documents = ((rows ?? []) as Record<string, unknown>[]).map(asDocument);
  const ownerIds = [...new Set(documents.map((doc) => doc.ownerId).filter(Boolean))] as string[];
  const templateIds = [...new Set(documents.map((doc) => doc.templateId).filter(Boolean))] as string[];

  const [{ data: owners }, { data: templates }] = await Promise.all([
    ownerIds.length > 0
      ? db.from("User").select("id, name, email").in("id", ownerIds)
      : Promise.resolve({ data: [] as DocumentListPerson[] }),
    templateIds.length > 0
      ? db.from("DocumentTemplate").select("id, name").in("id", templateIds)
      : Promise.resolve({ data: [] as DocumentListTemplate[] }),
  ]);

  const ownerById = new Map(
    ((owners ?? []) as DocumentListPerson[]).map((person) => [person.id, person])
  );
  const templateById = new Map(
    ((templates ?? []) as DocumentListTemplate[]).map((template) => [template.id, template])
  );

  return documents.map((doc) => ({
    ...doc,
    owner: doc.ownerId ? ownerById.get(doc.ownerId) ?? null : null,
    template: doc.templateId ? templateById.get(doc.templateId) ?? null : null,
  }));
}

export async function loadDocumentFormOptions(tenantId: string): Promise<{
  owners: DocumentFormUser[];
  templates: DocumentFormTemplate[];
}> {
  const db = getAdminDb();
  const [{ data: memberships }, { data: templates }] = await Promise.all([
    db.from("UserTenant").select("userId, role").eq("tenantId", tenantId),
    db
      .from("DocumentTemplate")
      .select("id, name, category, description, defaultReviewIntervalMonths, isGlobal, pdcaGuidance, tenantId")
      .or(`isGlobal.eq.true,tenantId.eq.${tenantId}`)
      .order("name", { ascending: true }),
  ]);

  const userIds = ((memberships ?? []) as Array<{ userId: string; role: string }>).map(
    (row) => row.userId
  );
  let users: Array<{ id: string; name: string | null; email: string }> = [];
  if (userIds.length > 0) {
    const { data: userRows } = await db.from("User").select("id, name, email").in("id", userIds);
    users = (userRows ?? []) as Array<{ id: string; name: string | null; email: string }>;
  }

  const roleByUser = new Map(
    ((memberships ?? []) as Array<{ userId: string; role: string }>).map((row) => [
      row.userId,
      row.role,
    ])
  );

  const owners = users
    .map((person) => ({
      id: person.id,
      name: person.name || person.email,
      email: person.email,
      role: roleByUser.get(person.id) ?? "ANSATT",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const templateOptions = ((templates ?? []) as DocumentFormTemplate[]).map((template) => ({
    ...template,
    pdcaGuidance: (template.pdcaGuidance as Record<string, string> | null) ?? null,
  }));

  return { owners, templates: templateOptions };
}

export async function loadDocumentById(input: {
  id: string;
  tenantId: string;
}): Promise<Document | null> {
  const { data, error } = await getAdminDb()
    .from("Document")
    .select("*")
    .eq("id", input.id)
    .eq("tenantId", input.tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "DOCUMENT_LOAD_FAILED", message: error.message };
  }
  return data ? asDocument(data as Record<string, unknown>) : null;
}

export async function loadDocumentDetail(input: {
  id: string;
  tenantId: string;
}): Promise<DocumentDetail | null> {
  const db = getAdminDb();
  const { data: row, error } = await db
    .from("Document")
    .select("*")
    .eq("id", input.id)
    .eq("tenantId", input.tenantId)
    .maybeSingle();

  if (error) {
    throw { code: "DOCUMENT_DETAIL_FAILED", message: error.message };
  }
  if (!row) return null;

  const document = asDocument(row as Record<string, unknown>);

  const [{ data: versions }, { data: signatures }, { data: template }] = await Promise.all([
    db
      .from("DocumentVersion")
      .select("*")
      .eq("documentId", document.id)
      .order("createdAt", { ascending: false })
      .limit(5),
    db
      .from("DocumentSignature")
      .select("*")
      .eq("documentId", document.id)
      .order("role", { ascending: true }),
    document.templateId
      ? db.from("DocumentTemplate").select("*").eq("id", document.templateId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const signatureRows = (signatures ?? []) as DocumentSignature[];
  const peopleIds = [
    ...new Set(
      [
        ...signatureRows.map((row) => row.signedById),
        document.ownerId,
        document.approvedBy,
      ].filter((id): id is string => Boolean(id))
    ),
  ];

  let peopleById = new Map<string, { id: string; name: string | null; email: string | null }>();
  if (peopleIds.length > 0) {
    const { data: people } = await db.from("User").select("id, name, email").in("id", peopleIds);
    peopleById = new Map(
      ((people ?? []) as Array<{ id: string; name: string | null; email: string | null }>).map(
        (person) => [person.id, person]
      )
    );
  }

  return {
    ...document,
    template: (template as DocumentTemplate | null) ?? null,
    versions: (versions ?? []) as DocumentVersion[],
    signatures: signatureRows.map((signature) => ({
      ...signature,
      signedBy: peopleById.get(signature.signedById) ?? null,
    })),
    approvedByUser: document.approvedBy ? peopleById.get(document.approvedBy) ?? null : null,
    owner: document.ownerId ? peopleById.get(document.ownerId) ?? null : null,
  };
}
