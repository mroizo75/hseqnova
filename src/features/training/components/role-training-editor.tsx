"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  setRoleTrainingRequirement,
  removeRoleTrainingRequirement,
} from "@/server/actions/role-training.actions";
import type { RoleTrainingRequirement } from "@/server/actions/role-training.actions";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  HMS: "HSE Manager",
  LEDER: "Line Manager",
  VERNEOMBUD: "Safety Representative",
  ANSATT: "Employee",
  BHT: "Occupational Health",
  REVISOR: "Auditor",
};

const ROLES_ORDER = ["ADMIN", "HMS", "LEDER", "VERNEOMBUD", "ANSATT", "BHT", "REVISOR"];

interface CourseInfo {
  courseKey: string;
  title: string;
}

interface RoleTrainingEditorProps {
  courses: CourseInfo[];
  requirements: RoleTrainingRequirement[];
}

type CellKey = `${string}::${string}`;

function cellKey(role: string, courseKey: string): CellKey {
  return `${role}::${courseKey}`;
}

export function RoleTrainingEditor({ courses, requirements }: RoleTrainingEditorProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const initialChecked = new Map<CellKey, boolean>();
  for (const req of requirements) {
    initialChecked.set(cellKey(req.role, req.courseKey), true);
  }
  const [checked, setChecked] = useState(initialChecked);

  const [pendingCells, setPendingCells] = useState(new Set<CellKey>());

  const handleToggle = (role: string, courseKey: string) => {
    const key = cellKey(role, courseKey);
    const isCurrentlyChecked = checked.get(key) ?? false;

    setPendingCells((prev) => new Set(prev).add(key));

    startTransition(async () => {
      try {
        if (isCurrentlyChecked) {
          const result = await removeRoleTrainingRequirement({ role, courseKey });
          if (!result.success) throw new Error(result.error);
          setChecked((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        } else {
          const result = await setRoleTrainingRequirement({
            role,
            courseKey,
            isMandatory: true,
          });
          if (!result.success) throw new Error(result.error);
          setChecked((prev) => new Map(prev).set(key, true));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not update requirement",
          variant: "destructive",
        });
      } finally {
        setPendingCells((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    });
  };

  const roleCount = (role: string) => {
    let count = 0;
    for (const course of courses) {
      if (checked.get(cellKey(role, course.courseKey))) count++;
    }
    return count;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Role Training Requirements
        </CardTitle>
        <CardDescription>
          Define which courses are required for each job role.
          HSWA 1974 s.2(2)(c): duty to provide information, instruction, training and supervision.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No course templates found. Add courses in the course templates section first.
          </p>
        ) : (
          <div className="overflow-auto max-h-[60vh] border rounded-lg -mx-3 px-3 sm:mx-0 sm:px-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left p-2 font-semibold sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 border-r border-b min-w-[160px]">
                    Role
                  </th>
                  {courses.map((course) => (
                    <th
                      key={course.courseKey}
                      className="relative p-1 bg-slate-100 dark:bg-slate-800 border-b border-l"
                      style={{ minWidth: "44px", maxWidth: "54px", width: "54px" }}
                    >
                      <div className="flex items-start justify-center" style={{ height: "110px" }}>
                        <div
                          className="absolute bottom-2 left-1/2 origin-bottom-left text-xs font-semibold whitespace-nowrap"
                          style={{
                            transform: "rotate(-45deg) translateX(-50%)",
                            transformOrigin: "0 0",
                            width: "110px",
                            textAlign: "left",
                          }}
                        >
                          {course.title}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES_ORDER.map((role) => (
                  <tr key={role} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2 sticky left-0 bg-background z-10 border-r">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <span className="font-semibold text-sm">
                          {ROLE_LABELS[role] ?? role}
                        </span>
                        {roleCount(role) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {roleCount(role)}
                          </Badge>
                        )}
                      </div>
                    </td>
                    {courses.map((course) => {
                      const key = cellKey(role, course.courseKey);
                      const isChecked = checked.get(key) ?? false;
                      const isCellPending = pendingCells.has(key);

                      return (
                        <td
                          key={course.courseKey}
                          className="p-1 text-center border-l"
                          style={{ minWidth: "44px", maxWidth: "54px" }}
                        >
                          {isCellPending ? (
                            <div className="flex justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggle(role, course.courseKey)}
                                disabled={isPending && isCellPending}
                                aria-label={`${ROLE_LABELS[role] ?? role}: ${course.title}`}
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Changes are saved automatically. Tick a box to require that course for the role.
        </p>
      </CardContent>
    </Card>
  );
}
