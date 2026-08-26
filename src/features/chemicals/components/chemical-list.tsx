"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Eye, Download, Search, Filter, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { deleteChemical } from "@/server/actions/chemical.actions";
import { useToast } from "@/hooks/use-toast";
import type { Chemical } from "@prisma/client";
import { normalizePpeFile } from "@/lib/pictograms";
import { IsocyanateBadge } from "@/components/isocyanate-warning";
import { ExposureRegisterBadge } from "@/components/exposure-register-warning";

interface ChemicalListProps {
  chemicals: Chemical[];
  initialIsocyanateFilter?: "only" | "exclude" | undefined;
  initialQuickFilter?: "missingSds" | "needsReview" | "overdue" | undefined;
}

export function ChemicalList({
  chemicals,
  initialIsocyanateFilter,
  initialQuickFilter,
}: ChemicalListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isocyanateFilter, setIsocyanateFilter] = useState<string>(
    initialIsocyanateFilter ?? "all",
  );
  const [revisionFilter, setRevisionFilter] = useState<string>(
    initialQuickFilter === "needsReview" ? "next30days" : initialQuickFilter === "overdue" ? "overdue" : "all",
  );
  const [missingSdsFilter, setMissingSdsFilter] = useState<string>(
    initialQuickFilter === "missingSds" ? "only" : "all",
  );
  const [sortOption, setSortOption] = useState<string>("revisionAsc");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("chemicalsTableState");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        searchTerm?: string;
        statusFilter?: string;
        isocyanateFilter?: string;
        missingSdsFilter?: string;
        revisionFilter?: string;
        sortOption?: string;
        page?: number;
      };
      if (typeof parsed.searchTerm === "string") {
        setSearchTerm(parsed.searchTerm);
      }
      if (typeof parsed.isocyanateFilter === "string" && !initialIsocyanateFilter) {
        setIsocyanateFilter(parsed.isocyanateFilter);
      } else if (initialIsocyanateFilter) {
        setIsocyanateFilter(initialIsocyanateFilter);
      }
      if (initialQuickFilter === "missingSds") {
        setMissingSdsFilter("only");
      } else if (typeof parsed.missingSdsFilter === "string") {
        setMissingSdsFilter(parsed.missingSdsFilter);
      }
      if (initialQuickFilter === "needsReview") {
        setRevisionFilter("next30days");
      } else if (initialQuickFilter === "overdue") {
        setRevisionFilter("overdue");
      } else if (typeof parsed.revisionFilter === "string") {
        setRevisionFilter(parsed.revisionFilter);
      }
      if (typeof parsed.sortOption === "string") {
        setSortOption(parsed.sortOption);
      }
      if (typeof parsed.page === "number" && parsed.page > 0) {
        setPage(parsed.page);
      }
    } catch {
      // Ignore corrupt saved filter state.
    }
  }, [initialIsocyanateFilter, initialQuickFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = {
      searchTerm,
      statusFilter,
      isocyanateFilter,
      missingSdsFilter,
      revisionFilter,
      sortOption,
      page,
    };
    window.localStorage.setItem("chemicalsTableState", JSON.stringify(state));
  }, [searchTerm, statusFilter, isocyanateFilter, missingSdsFilter, revisionFilter, sortOption, page]);

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Delete "${productName}" from the COSHH register?\n\nThis cannot be undone.`)) {
      return;
    }

    setLoading(id);
    const result = await deleteChemical(id);
    if (result.success) {
      toast({
        title: "Chemical deleted",
        description: `"${productName}" has been removed from the COSHH register`,
      });
      router.refresh();
    } else {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: result.error || "Could not delete the chemical",
      });
    }
    setLoading(null);
  };

  const handleDownloadSDS = (id: string, productName: string) => {
    setLoading(id);
    window.open(`/api/chemicals/${id}/download-sds`, "_blank");
    toast({
      title: "Safety data sheet",
      description: `Downloading the SDS for "${productName}"`,
      className: "bg-green-50 border-green-200",
    });
    setLoading(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 border-green-200">In use</Badge>;
      case "PHASED_OUT":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Being phased out</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isOverdue = (nextReviewDate: Date | null) => {
    if (!nextReviewDate) return false;
    return new Date(nextReviewDate) < new Date();
  };

  const filteredChemicals = chemicals.filter((chemical) => {
    const matchesSearch =
      chemical.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chemical.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chemical.casNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== "all" && chemical.status !== statusFilter) return false;

    if (isocyanateFilter === "only" && !chemical.containsIsocyanates) return false;
    if (isocyanateFilter === "exclude" && chemical.containsIsocyanates) return false;

    if (missingSdsFilter === "only" && chemical.sdsKey) return false;

    if (revisionFilter !== "all") {
      const now = new Date();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const revDate = chemical.nextReviewDate
        ? new Date(chemical.nextReviewDate)
        : null;

      switch (revisionFilter) {
        case "hasDate":
          if (!revDate) return false;
          break;
        case "noDate":
          if (revDate) return false;
          break;
        case "overdue":
          if (!revDate || revDate >= now) return false;
          break;
        case "next30days":
          if (!revDate || revDate <= now || revDate > thirtyDaysFromNow) {
            return false;
          }
          break;
        default:
          break;
      }
    }

    return true;
  });

  const sortedChemicals = [...filteredChemicals].sort((a, b) => {
    switch (sortOption) {
      case "productAsc":
        return a.productName.localeCompare(b.productName, "en-GB");
      case "productDesc":
        return b.productName.localeCompare(a.productName, "en-GB");
      case "supplierAsc": {
        const aSup = a.supplier || "";
        const bSup = b.supplier || "";
        return aSup.localeCompare(bSup, "en-GB");
      }
      case "supplierDesc": {
        const aSup = a.supplier || "";
        const bSup = b.supplier || "";
        return bSup.localeCompare(aSup, "en-GB");
      }
      case "revisionDesc":
      case "revisionAsc": {
        const aDate = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : null;
        const bDate = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : null;

        if (aDate === null && bDate === null) return 0;
        if (aDate === null) return 1;
        if (bDate === null) return -1;

        if (sortOption === "revisionAsc") {
          return aDate - bDate;
        }
        return bDate - aDate;
      }
      default:
        return 0;
    }
  });

  const totalFiltered = sortedChemicals.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedChemicals = sortedChemicals.slice(
    startIndex,
    startIndex + pageSize,
  );

  if (chemicals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold">No chemicals registered</h3>
        <p className="mb-4 text-muted-foreground">
          Start by adding the first product to the COSHH register.
        </p>
        <Link href="/dashboard/chemicals/new">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Register a chemical
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search product, supplier or CAS..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={isocyanateFilter}
            onValueChange={(value) => {
              setIsocyanateFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Diisocyanates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All substances</SelectItem>
              <SelectItem value="only">Diisocyanates only</SelectItem>
              <SelectItem value="exclude">Exclude diisocyanates</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">In use</SelectItem>
              <SelectItem value="PHASED_OUT">Being phased out</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={missingSdsFilter}
            onValueChange={(value) => {
              setMissingSdsFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="SDS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="only">Missing SDS</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={revisionFilter}
            onValueChange={(value) => {
              setRevisionFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Review" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reviews</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="next30days">Next 30 days</SelectItem>
              <SelectItem value="hasDate">Has a date</SelectItem>
              <SelectItem value="noDate">No date</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOption}
            onValueChange={(value) => {
              setSortOption(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revisionAsc">Review (oldest first)</SelectItem>
              <SelectItem value="revisionDesc">Review (newest first)</SelectItem>
              <SelectItem value="productAsc">Product (A–Z)</SelectItem>
              <SelectItem value="productDesc">Product (Z–A)</SelectItem>
              <SelectItem value="supplierAsc">Supplier (A–Z)</SelectItem>
              <SelectItem value="supplierDesc">Supplier (Z–A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {paginatedChemicals.length} of {totalFiltered} filtered chemicals
        {totalFiltered !== chemicals.length ? ` (${chemicals.length} in total)` : ""} —{" "}
        {pageSize} per page
      </div>

      <div className="w-full min-w-0 overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[16%] min-w-0 px-2">Product</TableHead>
              <TableHead className="hidden w-[11%] min-w-0 px-2 lg:table-cell">Supplier</TableHead>
              <TableHead className="hidden w-[7%] min-w-0 px-2 xl:table-cell">CAS</TableHead>
              <TableHead className="hidden w-[12%] min-w-0 px-2 xl:table-cell">H-statements</TableHead>
              <TableHead className="w-[9%] min-w-0 px-2">Hazard</TableHead>
              <TableHead className="hidden w-[9%] min-w-0 px-2 lg:table-cell">PPE</TableHead>
              <TableHead className="hidden w-[5%] min-w-0 px-2 md:table-cell">SDS</TableHead>
              <TableHead className="hidden w-[8%] min-w-0 px-2 md:table-cell">Review</TableHead>
              <TableHead className="w-[13%] min-w-0 px-2">Status</TableHead>
              <TableHead className="w-[10%] min-w-0 px-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedChemicals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No chemicals match the filters
                </TableCell>
              </TableRow>
            ) : (
              paginatedChemicals.map((chemical) => {
                const pictograms = chemical.warningPictograms
                  ? (() => { try { return JSON.parse(chemical.warningPictograms) as string[]; } catch { return []; } })()
                  : [];
                const ppeList = chemical.requiredPPE
                  ? (() => { try { return JSON.parse(chemical.requiredPPE) as string[]; } catch { return []; } })()
                  : [];

                return (
                <TableRow key={chemical.id}>
                  <TableCell className="font-medium min-w-0 px-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="truncate" title={chemical.productName}>{chemical.productName}</span>
                      <div className="flex flex-wrap gap-1">
                        {chemical.containsIsocyanates && <IsocyanateBadge />}
                        <ExposureRegisterBadge
                          hazardStatements={chemical.hazardStatements}
                          isCMR={chemical.isCMR}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell min-w-0 px-2">
                    <span className="truncate block" title={chemical.supplier || undefined}>{chemical.supplier || "-"}</span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell min-w-0 px-2 text-xs">
                    <span className="truncate block" title={chemical.casNumber || undefined}>{chemical.casNumber || "-"}</span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell min-w-0 px-2">
                    {chemical.hazardStatements ? (
                      <span className="text-sm text-orange-700 line-clamp-2 block truncate" title={chemical.hazardStatements}>
                        {chemical.hazardStatements}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="min-w-0 px-2">
                    {pictograms.length > 0 ? (
                      <>
                        <div className="lg:hidden">
                          <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300 text-xs">
                            {pictograms.length} hazard
                          </Badge>
                        </div>
                        <div className="hidden lg:flex gap-0.5 flex-wrap max-w-full">
                          {pictograms.slice(0, 3).map((file: string, idx: number) => (
                            <div key={idx} className="relative w-6 h-6 flex-shrink-0 border border-orange-200 rounded p-0.5">
                              <Image
                                src={`/faremerker/${file}`}
                                alt="Hazard pictogram"
                                width={24}
                                height={24}
                                className="object-contain"
                              />
                            </div>
                          ))}
                          {pictograms.length > 3 && (
                            <span className="text-xs text-muted-foreground self-center">+{pictograms.length - 3}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell min-w-0 px-2">
                    {ppeList.length > 0 ? (
                      <div className="flex gap-0.5 flex-wrap max-w-full">
                        {ppeList.slice(0, 3).map((file: string, idx: number) => {
                          const normalizedFile = normalizePpeFile(file);
                          if (!normalizedFile) return null;
                          return (
                            <div key={idx} className="relative w-6 h-6 flex-shrink-0 border border-blue-200 rounded p-0.5 bg-blue-50">
                              <Image
                                src={`/ppe/${normalizedFile}`}
                                alt="PPE"
                                width={24}
                                height={24}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          );
                        })}
                        {ppeList.length > 3 && (
                          <span className="text-xs text-muted-foreground self-center">+{ppeList.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-0 px-2">
                    {chemical.sdsKey ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadSDS(chemical.id, chemical.productName)}
                        disabled={loading === chemical.id}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell min-w-0 px-2 text-xs whitespace-nowrap">
                    {chemical.nextReviewDate ? (
                      <div>
                        <div className={isOverdue(chemical.nextReviewDate) ? "text-red-600 font-medium" : ""}>
                          {new Date(chemical.nextReviewDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </div>
                        {isOverdue(chemical.nextReviewDate) && (
                          <div className="text-xs text-red-600">Overdue</div>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="min-w-0 px-2">
                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                      {getStatusBadge(chemical.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right min-w-0 px-2">
                    <div className="flex items-center justify-end gap-0.5 flex-wrap">
                      <Link href={`/dashboard/chemicals/${chemical.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(chemical.id, chemical.productName)}
                        disabled={loading === chemical.id}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
