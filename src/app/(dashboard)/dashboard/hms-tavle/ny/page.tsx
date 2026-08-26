import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { getAdminDb } from "@/lib/supabase/admin";
import { NyTavleForm } from "@/features/hms-tavle/components/ny-tavle-form";

export default async function NyTavlePage() {
  const auth = await getAuthContext();
  if (!auth.permissions.canManageHmsTavle) redirect("/dashboard/hms-tavle");

  const db = getAdminDb();

  const [subscriptionRes, projectsRes] = await Promise.all([
    db
      .from("HmsTavleSubscription")
      .select("*")
      .eq("tenantId", auth.tenantId)
      .maybeSingle(),
    db
      .from("Project")
      .select("id, name, location")
      .eq("tenantId", auth.tenantId)
      .in("status", ["PLANNING", "ACTIVE"])
      .order("name", { ascending: true }),
  ]);

  const subscription = subscriptionRes.data;
  if (!subscription || subscription.status === "EXPIRED" || subscription.status === "CANCELLED") {
    redirect("/dashboard/hms-tavle");
  }

  // Filter out projects that already have a tavle
  const projects = projectsRes.data ?? [];
  const { data: existingTavleProjects } = await db
    .from("HmsTavle")
    .select("projectId")
    .eq("tenantId", auth.tenantId)
    .not("projectId", "is", null);

  const usedProjectIds = new Set((existingTavleProjects ?? []).map((t) => t.projectId));
  const availableProjects = projects.filter((p) => !usedProjectIds.has(p.id));

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New digital safety board</h1>
        <p className="text-muted-foreground mt-1">
          Create a new board for a project or construction site.
        </p>
      </div>
      <NyTavleForm projects={availableProjects} plan={subscription.plan} />
    </div>
  );
}
