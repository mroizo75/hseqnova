"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Trash2,
  FileText,
  Search,
  Filter,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  List,
  ExternalLink,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { deleteTraining } from "@/server/actions/training.actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  getTrainingStatus,
  getTrainingStatusLabel,
  getTrainingStatusColor,
} from "@/features/training/schemas/training.schema";
import { EditTrainingDialog } from "@/features/training/components/edit-training-dialog";
import { EmployeeCompetenceSheet } from "@/features/training/components/employee-competence-sheet";
import { PerEmployeeTrainingForm } from "@/features/training/components/per-employee-training-form";
import { formatTrainingDate } from "@/lib/training-uk";
import type { CourseTemplate, Training } from "@prisma/client";

type SortField = "title" | "employee" | "completedAt" | "validUntil" | "status";
type SortDir = "asc" | "desc";
type ViewMode = "employees" | "courses";
type TrainingRow = Training & { user?: { id: string; name: string | null; email: string } };

interface TrainingListProps {
  tenantId: string;
  trainings: TrainingRow[];
  tenantUsers?: Array<{ id: string; name: string | null; email: string }>;
  requiredCourseKeys?: string[];
  courseTemplates?: CourseTemplate[];
}

export function TrainingList({
  tenantId,
  trainings,
  tenantUsers = [],
  requiredCourseKeys = [],
  courseTemplates = [],
}: TrainingListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("validUntil");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("employees");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [addForUserId, setAddForUserId] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) {
      return;
    }

    setLoading(id);
    const result = await deleteTraining(id);
    if (result.success) {
      toast({ title: "Record deleted", description: `“${title}” has been removed.` });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: result.error || "The record could not be deleted.",
      });
    }
    setLoading(null);
  };

  const handleViewCertificate = async (id: string) => {
    setCertLoading(id);
    try {
      const res = await fetch(`/api/training/${id}/certificate`);
      if (!res.ok) {
        toast({ variant: "destructive", title: "File not found", description: "No certificate is attached." });
        return;
      }
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast({ variant: "destructive", title: "Could not open file", description: "Try again." });
    } finally {
      setCertLoading(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const filteredTrainings = useMemo(() => {
    return trainings.filter((training) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        training.title.toLowerCase().includes(query) ||
        training.provider.toLowerCase().includes(query) ||
        (training.user?.name?.toLowerCase().includes(query) || false) ||
        training.user?.email.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      return getTrainingStatus(training) === statusFilter;
    });
  }, [trainings, searchTerm, statusFilter]);

  const sortedTrainings = useMemo(() => {
    const sorted = [...filteredTrainings];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title, "en-GB");
          break;
        case "employee":
          cmp = (a.user?.name || a.user?.email || "").localeCompare(
            b.user?.name || b.user?.email || "",
            "en-GB",
          );
          break;
        case "completedAt": {
          const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          cmp = aDate - bDate;
          break;
        }
        case "validUntil": {
          const aDate = a.validUntil ? new Date(a.validUntil).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.validUntil ? new Date(b.validUntil).getTime() : Number.MAX_SAFE_INTEGER;
          cmp = aDate - bDate;
          break;
        }
        case "status": {
          const order = { EXPIRED: 0, EXPIRING_SOON: 1, NOT_STARTED: 2, COMPLETED: 3, VALID: 4 };
          cmp = (order[getTrainingStatus(a)] ?? 5) - (order[getTrainingStatus(b)] ?? 5);
          break;
        }
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [filteredTrainings, sortField, sortDir]);

  const employeeView = useMemo(() => {
    const now = new Date();
    return tenantUsers
      .map((user) => {
        const userTrainings = trainings.filter((row) => row.userId === user.id);
        const validCourseKeys = new Set(
          userTrainings
            .filter((row) => row.completedAt)
            .filter((row) => !row.validUntil || new Date(row.validUntil) >= now)
            .map((row) => row.courseKey),
        );
        const missingRequired = requiredCourseKeys.filter((key) => !validCourseKeys.has(key)).length;
        const expiringCount = userTrainings.filter((row) => {
          if (!row.validUntil) return false;
          const days = Math.ceil(
            (new Date(row.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          return days > 0 && days <= 30;
        }).length;
        const expiredCount = userTrainings.filter((row) => {
          if (!row.validUntil) return false;
          return new Date(row.validUntil) < now;
        }).length;

        return {
          user,
          trainings: userTrainings,
          totalCourses: userTrainings.length,
          missingRequired,
          expiringCount,
          expiredCount,
        };
      })
      .filter((row) => {
        if (!searchTerm) return true;
        const query = searchTerm.toLowerCase();
        return row.user.name?.toLowerCase().includes(query) || row.user.email.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aUrgent = a.expiredCount + a.missingRequired;
        const bUrgent = b.expiredCount + b.missingRequired;
        if (aUrgent !== bUrgent) return bUrgent - aUrgent;
        return (a.user.name || a.user.email).localeCompare(b.user.name || b.user.email, "en-GB");
      });
  }, [tenantUsers, trainings, requiredCourseKeys, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(sortedTrainings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTrainings = sortedTrainings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const employeeTotalPages = Math.max(1, Math.ceil(employeeView.length / PAGE_SIZE));
  const employeeCurrentPage = Math.min(page, employeeTotalPages);
  const paginatedEmployees = employeeView.slice(
    (employeeCurrentPage - 1) * PAGE_SIZE,
    employeeCurrentPage * PAGE_SIZE,
  );

  const selectedEmployee = tenantUsers.find((user) => user.id === selectedEmployeeId) ?? null;
  const selectedEmployeeRow = employeeView.find((row) => row.user.id === selectedEmployeeId);

  if (trainings.length === 0 && tenantUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No competence on file</h3>
        <p className="mb-4 text-muted-foreground">Start by adding courses or a CV for an employee.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={viewMode === "employees" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("employees");
                setPage(1);
              }}
              className="h-7 px-3 text-xs"
            >
              <Users className="mr-1 h-3 w-3" />
              By employee
            </Button>
            <Button
              variant={viewMode === "courses" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("courses");
                setPage(1);
              }}
              className="h-7 px-3 text-xs"
            >
              <List className="mr-1 h-3 w-3" />
              By course
            </Button>
          </div>
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={viewMode === "courses" ? "Search course, provider, employee..." : "Search employee..."}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {viewMode === "courses" && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="NOT_STARTED">Not recorded</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="VALID">Valid</SelectItem>
                <SelectItem value="EXPIRING_SOON">Expiring soon</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {viewMode === "courses" ? (
          <>
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, sortedTrainings.length)}–
            {Math.min(currentPage * PAGE_SIZE, sortedTrainings.length)} of {sortedTrainings.length} records
            {sortedTrainings.length !== trainings.length ? ` (filtered from ${trainings.length})` : ""}
          </>
        ) : (
          <>
            {employeeView.length} employee{employeeView.length === 1 ? "" : "s"}
            {searchTerm ? ` (filtered from ${tenantUsers.length})` : ""}
          </>
        )}
      </div>

      {viewMode === "courses" && (
        <>
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" onClick={() => handleSort("title")} className="flex items-center font-medium hover:text-foreground">
                      Course <SortIcon field="title" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => handleSort("employee")} className="flex items-center font-medium hover:text-foreground">
                      Employee <SortIcon field="employee" />
                    </button>
                  </TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>
                    <button type="button" onClick={() => handleSort("completedAt")} className="flex items-center font-medium hover:text-foreground">
                      Completed <SortIcon field="completedAt" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => handleSort("validUntil")} className="flex items-center font-medium hover:text-foreground">
                      Valid until <SortIcon field="validUntil" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" onClick={() => handleSort("status")} className="flex items-center font-medium hover:text-foreground">
                      Status <SortIcon field="status" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrainings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrainings.map((training) => {
                    const status = getTrainingStatus(training);
                    return (
                      <TableRow key={training.id} className="group">
                        <TableCell>
                          <Link href={`/dashboard/training/${training.id}`} className="hover:underline">
                            <div className="flex items-center gap-2 font-medium">
                              {training.title}
                              {training.isRequired ? <Badge variant="outline" className="text-xs">Required</Badge> : null}
                              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{training.user?.name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{training.user?.email}</div>
                        </TableCell>
                        <TableCell>{training.provider}</TableCell>
                        <TableCell>{formatTrainingDate(training.completedAt)}</TableCell>
                        <TableCell>
                          {training.validUntil ? (
                            <div>
                              {formatTrainingDate(training.validUntil)}
                              {status === "EXPIRING_SOON" ? (
                                <div className="mt-1 text-xs font-medium text-yellow-700">
                                  {Math.ceil(
                                    (new Date(training.validUntil).getTime() - new Date().getTime()) /
                                      (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days left
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Does not expire</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTrainingStatusColor(status)}>{getTrainingStatusLabel(status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!training.proofDocKey ? (
                              <EditTrainingDialog
                                training={training}
                                trigger={
                                  <Button variant="ghost" size="sm" title="Upload certificate" className="text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800">
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View certificate"
                                onClick={() => handleViewCertificate(training.id)}
                                disabled={certLoading === training.id}
                              >
                                {certLoading === training.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                ) : (
                                  <FileText className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            )}
                            <EditTrainingDialog training={training} />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(training.id, training.title)}
                              disabled={loading === training.id}
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {paginatedTrainings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No records found</p>
            ) : (
              paginatedTrainings.map((training) => {
                const status = getTrainingStatus(training);
                return (
                  <Card key={training.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link href={`/dashboard/training/${training.id}`} className="font-medium hover:underline">
                            {training.title}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {training.user?.name || "Unknown"}
                            {training.provider ? ` · ${training.provider}` : ""}
                          </p>
                        </div>
                        <Badge className={getTrainingStatusColor(status)}>{getTrainingStatusLabel(status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Valid until: {training.validUntil ? formatTrainingDate(training.validUntil) : "Does not expire"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {viewMode === "employees" && (
        <>
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">On file</TableHead>
                  <TableHead className="text-center">Missing required</TableHead>
                  <TableHead className="text-center">Expiring soon</TableHead>
                  <TableHead className="text-center">Expired</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const hasProblems = emp.expiredCount > 0 || emp.missingRequired > 0;
                    const hasWarnings = emp.expiringCount > 0;
                    return (
                      <TableRow
                        key={emp.user.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedEmployeeId(emp.user.id)}
                      >
                        <TableCell>
                          <div className="font-medium">{emp.user.name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{emp.user.email}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{emp.totalCourses}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.missingRequired > 0 ? (
                            <Badge variant="destructive" className="text-xs">{emp.missingRequired} missing</Badge>
                          ) : (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.expiringCount > 0 ? (
                            <Badge className="border-yellow-300 bg-yellow-100 text-xs text-black">{emp.expiringCount}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {emp.expiredCount > 0 ? (
                            <Badge variant="destructive" className="text-xs">{emp.expiredCount}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasProblems ? (
                            <XCircle className="mx-auto h-4 w-4 text-red-600" />
                          ) : hasWarnings ? (
                            <AlertTriangle className="mx-auto h-4 w-4 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {paginatedEmployees.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No employees found</p>
            ) : (
              paginatedEmployees.map((emp) => {
                const hasProblems = emp.expiredCount > 0 || emp.missingRequired > 0;
                const hasWarnings = emp.expiringCount > 0;
                return (
                  <Card key={emp.user.id} className="cursor-pointer" onClick={() => setSelectedEmployeeId(emp.user.id)}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium">{emp.user.name || "Unknown"}</h3>
                          <p className="text-sm text-muted-foreground">{emp.user.email}</p>
                        </div>
                        {hasProblems ? (
                          <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                        ) : hasWarnings ? (
                          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{emp.totalCourses} on file</p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <Pagination currentPage={employeeCurrentPage} totalPages={employeeTotalPages} onPageChange={setPage} />
        </>
      )}

      <EmployeeCompetenceSheet
        open={!!selectedEmployee}
        onOpenChange={(open) => {
          if (!open) setSelectedEmployeeId(null);
        }}
        tenantId={tenantId}
        employee={selectedEmployee}
        trainings={selectedEmployeeRow?.trainings ?? []}
        missingRequired={selectedEmployeeRow?.missingRequired ?? 0}
        onAddCompetence={() => {
          if (selectedEmployeeId) setAddForUserId(selectedEmployeeId);
        }}
      />

      <PerEmployeeTrainingForm
        tenantId={tenantId}
        users={tenantUsers}
        courseTemplates={courseTemplates}
        open={!!addForUserId}
        preselectedUserId={addForUserId ?? undefined}
        onOpenChange={(open) => {
          if (!open) setAddForUserId(null);
        }}
      />
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 bg-transparent p-0" onClick={() => onPageChange(1)} disabled={currentPage === 1} title="First page">
          «
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 bg-transparent p-0" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((item, i) =>
            item === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
            ) : (
              <Button
                key={item}
                variant={currentPage === item ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(item as number)}
                className={currentPage === item ? "h-8 w-8 p-0" : "h-8 w-8 bg-transparent p-0"}
              >
                {item}
              </Button>
            ),
          )}
        <Button variant="outline" size="sm" className="h-8 w-8 bg-transparent p-0" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 bg-transparent p-0" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} title="Last page">
          »
        </Button>
      </div>
    </div>
  );
}
