"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Shield, Building2, Edit, Trash2, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { deleteUser } from "@/server/actions/admin.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminUserListProps {
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    isSuperAdmin: boolean;
    isSupport: boolean;
    isSales: boolean;
    isSalesManager: boolean;
    createdAt: Date;
    tenants: Array<{
      role: string;
      tenant: {
        id: string;
        name: string;
      };
    }>;
  }>;
  currentPage: number;
  totalPages: number;
  currentUserId: string;
}

export function AdminUserList({ users, currentPage, totalPages, currentUserId }: AdminUserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce søk med timeout
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
        params.set("page", "1"); // Reset til side 1 ved søk
      } else {
        params.delete("search");
      }
      router.push(`/admin/users?${params.toString()}`);
    }, 500);

    // Cleanup timeout
    return () => clearTimeout(timeoutId);
  };

  // Vis alle brukere (server har allerede filtrert og paginert)
  const filteredUsers = users;

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const result = await deleteUser(pendingDelete.id);
      if (result.success) {
        toast.success("User deleted", {
          description: `${pendingDelete.email} has been removed.`,
        });
        setPendingDelete(null);
        router.refresh();
      } else {
        toast.error("Could not delete the user", {
          description: result.error || "Try again, or check that the user is not a superadmin.",
        });
      }
    } catch {
      toast.error("Could not delete the user", {
        description: "Something went wrong. Try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or organisation..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              router.push("/admin/users");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Organisations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.isSuperAdmin && (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{user.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.tenants.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {user.tenants.map((t) => (
                          <div key={t.tenant.id} className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{t.tenant.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {t.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isSuperAdmin ? (
                      <Badge className="bg-primary">SUPERADMIN</Badge>
                    ) : user.isSalesManager ? (
                      <Badge className="bg-amber-600">SALES MANAGER</Badge>
                    ) : user.isSales ? (
                      <Badge className="bg-emerald-700">SALES</Badge>
                    ) : user.isSupport ? (
                      <Badge className="bg-blue-700">SUPPORT</Badge>
                    ) : user.tenants.length > 0 ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">No organisation</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/users/${user.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDelete({ id: user.id, email: user.email })}
                        disabled={user.isSuperAdmin || user.id === currentUserId || deleting}
                        aria-label={`Delete ${user.email}`}
                      >
                        {deleting && pendingDelete?.id === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginering */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={currentPage > 1 ? `/admin/users?page=${currentPage - 1}${searchTerm ? `&search=${searchTerm}` : ""}` : "#"}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Første side */}
              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink href={`/admin/users?page=1${searchTerm ? `&search=${searchTerm}` : ""}`}>
                    1
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis */}
              {currentPage > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Forrige side */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink href={`/admin/users?page=${currentPage - 1}${searchTerm ? `&search=${searchTerm}` : ""}`}>
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Nåværende side */}
              <PaginationItem>
                <PaginationLink href={`/admin/users?page=${currentPage}${searchTerm ? `&search=${searchTerm}` : ""}`} isActive>
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {/* Neste side */}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink href={`/admin/users?page=${currentPage + 1}${searchTerm ? `&search=${searchTerm}` : ""}`}>
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis */}
              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Siste side */}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink href={`/admin/users?page=${totalPages}${searchTerm ? `&search=${searchTerm}` : ""}`}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href={
                    currentPage < totalPages
                      ? `/admin/users?page=${currentPage + 1}${searchTerm ? `&search=${searchTerm}` : ""}`
                      : "#"
                  }
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.email} will be removed from the platform. Organisation records they owned stay in place.`
                : "This user will be removed from the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

