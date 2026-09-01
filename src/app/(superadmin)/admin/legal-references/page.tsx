"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, ExternalLink } from "lucide-react";
import {
  getAllLegalReferencesAdmin,
  createLegalReference,
  updateLegalReference,
  deleteLegalReference,
  type LegalReferenceRow,
} from "@/server/actions/legal-reference.actions";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_INDUSTRIES } from "@/lib/pricing";

const INDUSTRY_OPTIONS = [
  { value: "all", label: "All industries" },
  ...SUPPORTED_INDUSTRIES.map((i) => ({ value: i.value, label: i.label })),
];

function industriesToLabel(industries: unknown): string {
  if (!industries || !Array.isArray(industries)) return "-";
  if (industries.includes("all")) return "All industries";
  return industries
    .map(
      (v) =>
        INDUSTRY_OPTIONS.find((o) => o.value === v)?.label ?? v
    )
    .join(", ");
}

export default function AdminLegalReferencesPage() {
  const { toast } = useToast();
  const [refs, setRefs] = useState<LegalReferenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(["all"]);

  useEffect(() => {
    loadRefs();
  }, []);

  async function loadRefs() {
    const result = await getAllLegalReferencesAdmin();
    if (result.success && result.data) {
      setRefs(result.data);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setLoading(false);
  }

  function openNew() {
    setEditingId(null);
    setSelectedIndustries(["all"]);
    setDialogOpen(true);
  }

  function openEdit(ref: (typeof refs)[0]) {
    setEditingId(ref.id);
    const ind = ref.industries as string[];
    setSelectedIndustries(ind?.length ? ind : ["all"]);
    setDialogOpen(true);
  }

  function toggleIndustry(value: string) {
    if (value === "all") {
      setSelectedIndustries(["all"]);
    } else {
      setSelectedIndustries((prev) => {
        const withoutAll = prev.filter((p) => p !== "all");
        if (withoutAll.includes(value)) {
          const next = withoutAll.filter((p) => p !== value);
          return next.length ? next : ["all"];
        }
        return [...withoutAll, value];
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("industries", selectedIndustries.join(","));
    formData.set("sortOrder", (formData.get("sortOrder") as string) || "0");

    const result = editingId
      ? await updateLegalReference(editingId, formData)
      : await createLegalReference(formData);

    if (result.success) {
      toast({ title: "Saved", description: "Reference saved" });
      setDialogOpen(false);
      loadRefs();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete '${title}'?`)) return;
    const result = await deleteLegalReference(id);
    if (result.success) {
      toast({ title: "Deleted", description: "Reference removed" });
      loadRefs();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  const editingRef = editingId ? refs.find((r) => r.id === editingId) : null;

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legal register</h1>
          <p className="text-muted-foreground">
            Manage legislation and regulations by industry. Displayed to clients based on their industry.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              New reference
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit reference" : "New legal reference"}</DialogTitle>
            </DialogHeader>
            <form key={editingId ?? "new"} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={editingRef?.title}
                  placeholder="e.g. Health and Safety at Work Act 1974"
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="paragraphRef">Section reference</Label>
                <Input
                  id="paragraphRef"
                  name="paragraphRef"
                  defaultValue={editingRef?.paragraphRef ?? ""}
                  placeholder="e.g. s.2(3) or Part 3"
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  defaultValue={editingRef?.description}
                  placeholder="Brief description of what applies"
                  rows={3}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="sourceUrl">Source URL (legislation.gov.uk etc.) *</Label>
                <Input
                  id="sourceUrl"
                  name="sourceUrl"
                  type="url"
                  required
                  defaultValue={editingRef?.sourceUrl}
                  placeholder="https://legislation.gov.uk/..."
                  disabled={submitting}
                />
              </div>
              <div>
                <Label>Industries *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select &apos;All industries&apos; or specific industries the reference applies to.
                </p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <Badge
                      key={opt.value}
                      variant={selectedIndustries.includes(opt.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleIndustry(opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue={editingRef?.sortOrder ?? 0}
                  disabled={submitting}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>References ({refs.length})</CardTitle>
          <p className="text-sm text-muted-foreground">
            Clients only see references relevant to their industry.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Industries</TableHead>
                <TableHead>Sort order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No references. Add legislation and regulations with associated industries.
                  </TableCell>
                </TableRow>
              ) : (
                refs.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.title}</TableCell>
                    <TableCell>{ref.paragraphRef ?? "-"}</TableCell>
                    <TableCell>
                      <span className="text-sm">{industriesToLabel(ref.industries)}</span>
                    </TableCell>
                    <TableCell>{ref.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <a href={ref.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="mr-1">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ref)} className="mr-1">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ref.id, ref.title)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
