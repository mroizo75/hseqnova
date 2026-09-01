import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { isSalesStaff } from "@/lib/platform-access";
import { loadCrmTasks } from "@/server/queries/crm.queries";
import { CrmCompleteTaskButton } from "@/features/crm/components/crm-task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";

export default async function CrmTasksPage() {
  const staff = await requirePlatformStaff();
  if (!staff || !isSalesStaff(staff)) {
    redirect("/admin");
  }
  const tasks = await loadCrmTasks(staff);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Follow-ups across the pipeline</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{tasks.length} tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3 border-b py-2 last:border-0">
                <div>
                  <Link
                    href={`/admin/crm/companies/${task.organisation.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {task.organisation.name}
                    {task.dueAt
                      ? ` · ${format(new Date(task.dueAt), "d MMM yyyy", { locale: enGB })}`
                      : ""}
                    {" · "}
                    {task.status === "DONE" ? "Done" : "Open"}
                  </p>
                </div>
                {task.status !== "DONE" && <CrmCompleteTaskButton taskId={task.id} />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
