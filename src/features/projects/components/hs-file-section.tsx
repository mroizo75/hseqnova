"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileText, FolderOpen, Upload } from "lucide-react";
import {
  listHsFileEntries,
  createHsFileEntry,
  deleteHsFileEntry,
} from "@/server/actions/hs-file.actions";

const CATEGORY_LABELS: Record<string, string> = {
  AS_BUILT_DRAWINGS: "As-built drawings and plans",
  DESIGN_CRITERIA: "Design criteria and specifications",
  HAZARDOUS_MATERIALS: "Details of hazardous materials used",
  MAINTENANCE_PROCEDURES: "Maintenance procedures and requirements",
  SERVICES_INFORMATION: "Services information (gas, electric, water)",
  STRUCTURAL_INFORMATION: "Structural information and loadings",
  EQUIPMENT_MANUALS: "Equipment manuals and certificates",
  EMERGENCY_PROCEDURES: "Emergency and fire procedures",
  CLEANING_PROCEDURES: "Safe cleaning procedures",
  OTHER: "Other relevant information",
};

const CATEGORY_ORDER = [
  "AS_BUILT_DRAWINGS",
  "DESIGN_CRITERIA",
  "HAZARDOUS_MATERIALS",
  "MAINTENANCE_PROCEDURES",
  "SERVICES_INFORMATION",
  "STRUCTURAL_INFORMATION",
  "EQUIPMENT_MANUALS",
  "EMERGENCY_PROCEDURES",
  "CLEANING_PROCEDURES",
  "OTHER",
] as const;

type HsFileEntry = {
  id: string;
  tenantId: string;
  projectId: string;
  category: string;
  title: string;
  description: string | null;
  fileKey: string | null;
  fileName: string | null;
  addedById: string | null;
  createdAt: string;
  updatedAt: string;
};

interface HsFileSectionProps {
  projectId: string;
  canManage: boolean;
}

export function HsFileSection({ projectId, canManage }: HsFileSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<HsFileEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newEntry, setNewEntry] = useState({
    category: "",
    title: "",
    description: "",
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await listHsFileEntries(projectId);
      setEntries(data as HsFileEntry[]);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load Health & Safety File entries.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, [projectId]);

  const handleCreate = async () => {
    if (!newEntry.category || !newEntry.title.trim()) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Category and title are required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createHsFileEntry({
        projectId,
        category: newEntry.category,
        title: newEntry.title,
        description: newEntry.description || undefined,
      });
      toast({ title: "Entry added", description: "The H&S file entry has been recorded." });
      setNewEntry({ category: "", title: "", description: "" });
      setShowForm(false);
      await loadEntries();
    } catch {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: "Check the required fields and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: HsFileEntry) => {
    if (!confirm(`Remove "${entry.title}" from the H&S file?`)) return;
    try {
      setDeletingId(entry.id);
      await deleteHsFileEntry(entry.id);
      toast({ title: "Entry removed", description: "The H&S file entry has been deleted." });
      await loadEntries();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove the entry.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = CATEGORY_ORDER.reduce<Record<string, HsFileEntry[]>>((acc, cat) => {
    const items = entries.filter((e) => e.category === cat);
    if (items.length > 0) {
      acc[cat] = items;
    }
    return acc;
  }, {});

  const hasEntries = entries.length > 0;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading Health &amp; Safety File...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Health &amp; Safety File
        </CardTitle>
        <CardDescription>
          CDM 2015 reg.12(5) &mdash; the client must ensure a health and safety file is prepared
          for each project, kept available for inspection, and revised as necessary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasEntries && !showForm ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium">No entries in the Health &amp; Safety File yet</p>
            <p className="mt-2 max-w-md mx-auto text-xs text-muted-foreground">
              The H&amp;S file should contain information needed to ensure health and safety during
              future construction work, maintenance, refurbishment, or demolition. HSE guidance
              suggests including: as-built drawings, design criteria, details of hazardous materials,
              maintenance procedures, services information, structural data, equipment manuals,
              emergency procedures, and safe cleaning procedures.
            </p>
            {canManage ? (
              <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add first entry
              </Button>
            ) : null}
          </div>
        ) : null}

        {hasEntries ? (
          <>
            <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
              The H&amp;S file must be kept available for inspection by any person who may need it
              to comply with health and safety duties (CDM 2015 reg.12(5)–(10)).
            </div>

            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  {CATEGORY_LABELS[category] ?? category}
                </h4>
                <div className="divide-y rounded-lg border">
                  {items.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 px-3 sm:px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm font-medium break-words">{entry.title}</span>
                          {entry.fileName ? (
                            <span className="text-xs text-muted-foreground truncate">({entry.fileName})</span>
                          ) : null}
                        </div>
                        {entry.description ? (
                          <p className="mt-1 text-xs text-muted-foreground pl-6">{entry.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground pl-6">
                          Added {new Date(entry.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {entry.fileKey ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/api/files/${entry.fileKey}`} target="_blank" rel="noopener noreferrer">
                              <Upload className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        {canManage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry)}
                            disabled={deletingId === entry.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {canManage ? (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add entry
              </Button>
            ) : null}
          </>
        ) : null}

        {showForm && canManage ? (
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="text-sm font-semibold">New H&amp;S file entry</h4>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <div>
                <Label>Category *</Label>
                <Select
                  value={newEntry.category}
                  onValueChange={(value) => setNewEntry((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={newEntry.title}
                  onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Ground floor structural plan"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={newEntry.description}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Additional notes about this entry"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCreate} disabled={submitting}>
                {submitting ? "Saving..." : "Add entry"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setNewEntry({ category: "", title: "", description: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {!canManage && !hasEntries ? (
          <div className="rounded border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
            You have read-only access. Only HSE manager, admin, line manager or safety representative
            roles can manage the H&amp;S file.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
