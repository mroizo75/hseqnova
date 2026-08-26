import { redirect } from "next/navigation";

interface NewActionPageProps {
  searchParams: Promise<{ projectId?: string; fireDrillId?: string }>;
}

export default async function NewActionPage({ searchParams }: NewActionPageProps) {
  const { projectId, fireDrillId } = await searchParams;
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (fireDrillId) params.set("fireDrillId", fireDrillId);
  const query = params.toString();
  redirect(query ? `/dashboard/actions?${query}` : "/dashboard/actions");
}
