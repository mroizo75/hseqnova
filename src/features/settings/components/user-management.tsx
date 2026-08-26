"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, User, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  inviteUser,
  updateUserRole,
  removeUserFromTenant,
  importUsersFromFile,
  activateUserInTenant,
  activateAllPendingUsers,
  updateEmployeeNumber,
  updateUserManager,
  updateUserPosition,
  assignManagerToUsers,
} from "@/server/actions/settings.actions";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Send, HelpCircle, Pencil, Check, X } from "lucide-react";
import { getRoleDisplayName } from "@/lib/permissions";
import type { Role } from "@prisma/client";

interface UserManagementProps {
  users: Array<{
    userId: string;
    role: string;
    invitationSentAt: Date | null;
    employeeNumber: string | null;
    position: string | null;
    managerId: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
      createdAt: Date;
    };
  }>;
  currentUserId: string;
  isAdmin: boolean;
}

const NO_MANAGER_VALUE = "__no_manager__";

const ROLE_OPTIONS: Role[] = [
  "ANSATT",
  "LEDER",
  "HMS",
  "VERNEOMBUD",
  "BHT",
  "REVISOR",
  "ADMIN",
];

function RoleSelectItems() {
  return (
    <>
      {ROLE_OPTIONS.map((role) => (
        <SelectItem key={role} value={role}>
          {getRoleDisplayName(role)}
        </SelectItem>
      ))}
    </>
  );
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "ADMIN":
      return "border-purple-200 bg-purple-100 text-purple-800";
    case "LEDER":
      return "border-blue-200 bg-blue-100 text-blue-800";
    case "HMS":
      return "border-orange-200 bg-orange-100 text-orange-800";
    case "VERNEOMBUD":
      return "border-green-200 bg-green-100 text-green-800";
    case "BHT":
      return "border-teal-200 bg-teal-100 text-teal-800";
    case "REVISOR":
      return "border-indigo-200 bg-indigo-100 text-indigo-800";
    default:
      return "border-gray-200 bg-gray-100 text-gray-800";
  }
}

export function UserManagement({ users, currentUserId, isAdmin }: UserManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);
  const [activatingAll, setActivatingAll] = useState(false);
  const [editingEmployeeNumber, setEditingEmployeeNumber] = useState<string | null>(null);
  const [employeeNumberDraft, setEmployeeNumberDraft] = useState("");
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [positionDraft, setPositionDraft] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkManagerId, setBulkManagerId] = useState(NO_MANAGER_VALUE);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pendingActivationCount = users.filter(
    (u) => !u.invitationSentAt && u.userId !== currentUserId
  ).length;

  const filteredUsers =
    searchQuery.trim().length > 0
      ? users.filter((u) => {
          const q = searchQuery.toLowerCase();
          const roleLabel = getRoleDisplayName(u.role as Role).toLowerCase();
          return (
            (u.user.name?.toLowerCase().includes(q) ?? false) ||
            u.user.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q) ||
            roleLabel.includes(q) ||
            (u.employeeNumber?.toLowerCase().includes(q) ?? false) ||
            (u.position?.toLowerCase().includes(q) ?? false)
          );
        })
      : users;

  const userLabelById = new Map(
    users.map((u) => [u.userId, u.user.name || u.user.email] as const)
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInviteLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      role: formData.get("role") as string,
    };

    const result = await inviteUser(data);

    if (result.success) {
      toast({
        title: "Invitation sent",
        description: `${data.email} can sign in with the temporary password in their email.`,
        className: "bg-green-50 border-green-200",
      });
      setInviteOpen(false);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not invite",
        description: result.error || "Could not invite this person",
      });
    }

    setInviteLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(userId);
    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      toast({
        title: "Role updated",
        description: "Access now follows the new role.",
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not update the role",
      });
    }

    setLoading(null);
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this company? They will lose access immediately.`)) {
      return;
    }

    setLoading(userId);
    const result = await removeUserFromTenant(userId);

    if (result.success) {
      toast({
        title: "Person removed",
        description: `${userName} no longer has access.`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not remove",
        description: result.error || "Could not remove this person",
      });
    }

    setLoading(null);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        variant: "destructive",
        title: "Choose a file",
        description: "Select a CSV or Excel file first.",
      });
      return;
    }
    setImportLoading(true);
    const formData = new FormData();
    formData.set("file", importFile);
    const result = await importUsersFromFile(formData);
    setImportLoading(false);
    setImportFile(null);

    if (!result.success) {
      const errMsg = "error" in result ? result.error : "Could not import";
      toast({
        variant: "destructive",
        title: "Import failed",
        description: errMsg,
      });
      return;
    }

    const baseMsg =
      result.skipped > 0
        ? `${result.imported} added, ${result.skipped} already members. Activate under Actions to send invitations.`
        : `${result.imported} people added. Activate under Actions to send invitations.`;
    const warningMsg =
      result.errors.length > 0
        ? ` ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} could not set a line manager: ${result.errors[0]}`
        : "";
    toast({
      title: "Import complete",
      description: baseMsg + warningMsg,
      className: "bg-green-50 border-green-200",
    });
    router.refresh();
  };

  const handleActivate = async (userId: string) => {
    setActivatingUserId(userId);
    const result = await activateUserInTenant(userId);
    setActivatingUserId(null);
    if (result.success) {
      toast({
        title: "Invitation sent",
        description: "A temporary password has been emailed.",
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not activate",
        description: "error" in result ? result.error : "Could not send the invitation",
      });
    }
  };

  const handleActivateAll = async () => {
    if (pendingActivationCount === 0) return;
    if (
      !confirm(
        `Send invitations to ${pendingActivationCount} ${pendingActivationCount === 1 ? "person" : "people"}? Each will receive a temporary password by email.`
      )
    ) {
      return;
    }
    setActivatingAll(true);
    const result = await activateAllPendingUsers();
    setActivatingAll(false);
    if (result.success) {
      const msg =
        result.failed > 0
          ? `${result.activated} invited, ${result.failed} failed.${result.errors.length > 0 ? ` ${result.errors[0]}` : ""}`
          : `${result.activated} ${result.activated === 1 ? "person" : "people"} invited.`;
      toast({
        title: "Invitations sent",
        description: msg,
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not activate",
        description: "error" in result ? result.error : "Could not send invitations",
      });
    }
  };

  const handleEmployeeNumberSave = async (userId: string) => {
    const result = await updateEmployeeNumber(userId, employeeNumberDraft);
    if (result.success) {
      toast({
        title: "Employee number saved",
        className: "bg-green-50 border-green-200",
      });
      setEditingEmployeeNumber(null);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not update the employee number",
      });
    }
  };

  const handlePositionSave = async (userId: string) => {
    const result = await updateUserPosition(userId, positionDraft);
    if (result.success) {
      toast({
        title: "Job title saved",
        className: "bg-green-50 border-green-200",
      });
      setEditingPosition(null);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not update the job title",
      });
    }
  };

  const handleManagerChange = async (userId: string, value: string) => {
    setLoading(userId);
    const result = await updateUserManager(userId, value === NO_MANAGER_VALUE ? null : value);
    setLoading(null);

    if (result.success) {
      toast({
        title: "Line manager saved",
        className: "bg-green-50 border-green-200",
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not update the line manager",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const toggleAllVisibleSelection = () => {
    const visibleIds = paginatedUsers.map((u) => u.userId);
    const allSelected = visibleIds.every((id) => selectedUserIds.includes(id));
    setSelectedUserIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  };

  const handleBulkManagerAssign = async () => {
    setBulkAssigning(true);
    const result = await assignManagerToUsers(
      selectedUserIds,
      bulkManagerId === NO_MANAGER_VALUE ? null : bulkManagerId
    );
    setBulkAssigning(false);

    if (result.success) {
      toast({
        title: "Line manager set",
        description: `${result.updated} ${result.updated === 1 ? "person" : "people"} updated`,
        className: "bg-green-50 border-green-200",
      });
      setSelectedUserIds([]);
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: result.error || "Could not assign the line manager",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              People ({users.length})
            </CardTitle>
            <CardDescription>
              Unlimited users. Import without sending mail; activate under Actions to invite.
              Line manager is used for accident-book routing (HSWA s.2 organisation).
            </CardDescription>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="max-w-[180px] text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  disabled={importLoading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleImport}
                  disabled={importLoading || !importFile}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  {importLoading ? "Importing…" : "Import"}
                </Button>
                <a
                  href="/api/users/import-example"
                  download="hseq-nova-user-import.xlsx"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Download Excel template
                </a>
              </div>

              <details className="group rounded-md border bg-muted/20 px-3 py-2 text-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <HelpCircle className="h-4 w-4" />
                  How to import
                </summary>
                <div className="mt-3 space-y-2 border-t pt-3 text-muted-foreground">
                  <p>
                    <strong>1. Template</strong> — columns <code className="rounded bg-muted px-1">email</code>,{" "}
                    <code className="rounded bg-muted px-1">name</code>,{" "}
                    <code className="rounded bg-muted px-1">role</code>.
                  </p>
                  <p>
                    <strong>2. Roles</strong> — Employee, Line manager, HSE manager, Safety
                    representative, Occupational health, Auditor, Administrator (or the system keys
                    ANSATT, LEDER, HMS, VERNEOMBUD, BHT, REVISOR, ADMIN).
                  </p>
                  <p>
                    <strong>3. Optional</strong> — <code className="rounded bg-muted px-1">job title</code>{" "}
                    (free text) and <code className="rounded bg-muted px-1">manager</code> (line
                    manager email). The manager can appear later in the file. Unknown manager emails
                    warn but do not stop the import.
                  </p>
                  <p>
                    <strong>4. Activate</strong> — Import does not send email. Use Activate all, or
                    Activate on a row, to send a temporary password.
                  </p>
                  <p className="pt-1 text-xs">CSV or .xlsx. Max 500 rows, 2 MB.</p>
                </div>
              </details>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a person</DialogTitle>
                    <DialogDescription>
                      They receive a temporary password and should change it under Profile after
                      first sign-in.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Jane Smith"
                        required
                        disabled={inviteLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Work email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="jane@company.co.uk"
                        required
                        disabled={inviteLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select name="role" required disabled={inviteLoading} defaultValue="ANSATT">
                        <SelectTrigger>
                          <SelectValue placeholder="Choose role" />
                        </SelectTrigger>
                        <SelectContent>
                          <RoleSelectItems />
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        HSE manager is the competent person (MHSWR 1999 reg.7). Safety
                        representative is SRSCWR 1977 / HSCER 1996.
                      </p>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => setInviteOpen(false)}
                        disabled={inviteLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={inviteLoading}>
                        {inviteLoading ? "Sending…" : "Send invitation"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {pendingActivationCount > 0 && isAdmin && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              {pendingActivationCount} {pendingActivationCount === 1 ? "person is" : "people are"}{" "}
              imported but not invited yet
            </p>
            <Button variant="default" size="sm" onClick={handleActivateAll} disabled={activatingAll}>
              <Send className="mr-2 h-4 w-4" />
              {activatingAll ? "Sending…" : "Invite all pending"}
            </Button>
          </div>
        )}

        {users.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, role, job title…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
          </div>
        )}

        {isAdmin && selectedUserIds.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-blue-900">
              {selectedUserIds.length} selected. Set the same line manager for all of them.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={bulkManagerId} onValueChange={setBulkManagerId}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Choose line manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_MANAGER_VALUE}>Clear line manager</SelectItem>
                  {users
                    .filter((candidate) => !selectedUserIds.includes(candidate.userId))
                    .map((candidate) => (
                      <SelectItem key={candidate.userId} value={candidate.userId}>
                        {candidate.user.name || candidate.user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkManagerAssign} disabled={bulkAssigning}>
                {bulkAssigning ? "Saving…" : "Apply to selected"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-foreground"
                onClick={() => setSelectedUserIds([])}
                disabled={bulkAssigning}
              >
                Clear selection
              </Button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery.trim().length > 0
              ? `No people match “${searchQuery}”`
              : "No people in this company yet"}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          paginatedUsers.length > 0 &&
                          paginatedUsers.every((u) => selectedUserIds.includes(u.userId))
                        }
                        onCheckedChange={toggleAllVisibleSelection}
                        aria-label="Select all visible people"
                      />
                    </TableHead>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee no.</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Line manager</TableHead>
                  <TableHead>Member since</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((userTenant) => {
                  const isCurrentUser = userTenant.userId === currentUserId;

                  return (
                    <TableRow key={userTenant.userId}>
                      {isAdmin && (
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.includes(userTenant.userId)}
                            onCheckedChange={() => toggleUserSelection(userTenant.userId)}
                            aria-label={`Select ${userTenant.user.name || userTenant.user.email}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">
                        {userTenant.user.name || "No name"}
                        {isCurrentUser && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{userTenant.user.email}</TableCell>
                      <TableCell>
                        {isAdmin && editingEmployeeNumber === userTenant.userId ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={employeeNumberDraft}
                              onChange={(e) => setEmployeeNumberDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEmployeeNumberSave(userTenant.userId);
                                if (e.key === "Escape") setEditingEmployeeNumber(null);
                              }}
                              placeholder="e.g. E-0042"
                              className="h-7 w-28 text-xs"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEmployeeNumberSave(userTenant.userId)}
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingEmployeeNumber(null)}
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            className={`group flex items-center gap-1.5 text-sm ${isAdmin ? "cursor-pointer hover:text-foreground" : "cursor-default"}`}
                            onClick={() => {
                              if (!isAdmin) return;
                              setEmployeeNumberDraft(userTenant.employeeNumber ?? "");
                              setEditingEmployeeNumber(userTenant.userId);
                            }}
                            title={isAdmin ? "Click to edit" : undefined}
                          >
                            <span
                              className={
                                userTenant.employeeNumber
                                  ? "font-mono text-xs"
                                  : "text-xs italic text-muted-foreground"
                              }
                            >
                              {userTenant.employeeNumber || (isAdmin ? "Set number" : "—")}
                            </span>
                            {isAdmin && (
                              <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin && editingPosition === userTenant.userId ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={positionDraft}
                              onChange={(e) => setPositionDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handlePositionSave(userTenant.userId);
                                if (e.key === "Escape") setEditingPosition(null);
                              }}
                              placeholder="e.g. Site supervisor"
                              className="h-7 w-32 text-xs"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handlePositionSave(userTenant.userId)}
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingPosition(null)}
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            className={`group flex items-center gap-1.5 text-sm ${isAdmin ? "cursor-pointer hover:text-foreground" : "cursor-default"}`}
                            onClick={() => {
                              if (!isAdmin) return;
                              setPositionDraft(userTenant.position ?? "");
                              setEditingPosition(userTenant.userId);
                            }}
                            title={isAdmin ? "Click to edit" : undefined}
                          >
                            <span
                              className={
                                userTenant.position
                                  ? "text-xs"
                                  : "text-xs italic text-muted-foreground"
                              }
                            >
                              {userTenant.position || (isAdmin ? "Set job title" : "—")}
                            </span>
                            {isAdmin && (
                              <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin && !isCurrentUser ? (
                          <Select
                            value={userTenant.role}
                            onValueChange={(value) => handleRoleChange(userTenant.userId, value)}
                            disabled={loading === userTenant.userId}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <RoleSelectItems />
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={roleBadgeClass(userTenant.role)}>
                            {getRoleDisplayName(userTenant.role as Role)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Select
                            value={userTenant.managerId ?? NO_MANAGER_VALUE}
                            onValueChange={(value) =>
                              handleManagerChange(userTenant.userId, value)
                            }
                            disabled={loading === userTenant.userId}
                          >
                            <SelectTrigger className="w-[170px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_MANAGER_VALUE}>Not set</SelectItem>
                              {users
                                .filter((candidate) => candidate.userId !== userTenant.userId)
                                .map((candidate) => (
                                  <SelectItem key={candidate.userId} value={candidate.userId}>
                                    {candidate.user.name || candidate.user.email}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {userTenant.managerId
                              ? (userLabelById.get(userTenant.managerId) ?? "—")
                              : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(userTenant.user.createdAt).toLocaleDateString("en-GB")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {!isCurrentUser && (
                            <div className="flex items-center justify-end gap-2">
                              {!userTenant.invitationSentAt && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleActivate(userTenant.userId)}
                                  disabled={
                                    activatingUserId === userTenant.userId ||
                                    loading === userTenant.userId
                                  }
                                >
                                  <Send className="mr-1 h-4 w-4" />
                                  {activatingUserId === userTenant.userId ? "Sending…" : "Invite"}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleRemove(
                                    userTenant.userId,
                                    userTenant.user.name || userTenant.user.email
                                  )
                                }
                                disabled={loading === userTenant.userId}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredUsers.length > pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredUsers.length)} of{" "}
              {filteredUsers.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - safePage) <= 1) return true;
                  return false;
                })
                .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push("ellipsis");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      variant={safePage === item ? "default" : "outline"}
                      size="sm"
                      className={safePage === item ? "min-w-[32px]" : "min-w-[32px] bg-transparent"}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!isAdmin && (
          <Card className="mt-4 border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800">Only administrators can invite or change roles.</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
