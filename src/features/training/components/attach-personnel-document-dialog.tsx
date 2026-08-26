"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTraining } from "@/server/actions/training.actions";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Upload } from "lucide-react";
import { PERSONNEL_DOCUMENT_TYPES } from "@/lib/training-uk";

interface AttachPersonnelDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  userId: string;
  employeeName: string;
}

export function AttachPersonnelDocumentDialog({
  open,
  onOpenChange,
  tenantId,
  userId,
  employeeName,
}: AttachPersonnelDocumentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [typeKey, setTypeKey] = useState<(typeof PERSONNEL_DOCUMENT_TYPES)[number]["key"]>("cv");
  const [title, setTitle] = useState<string>(PERSONNEL_DOCUMENT_TYPES[0].title);
  const [provider, setProvider] = useState<string>(PERSONNEL_DOCUMENT_TYPES[0].provider);
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const selectedType = PERSONNEL_DOCUMENT_TYPES.find((item) => item.key === typeKey) ?? PERSONNEL_DOCUMENT_TYPES[0];

  const handleTypeChange = (value: string) => {
    const next = PERSONNEL_DOCUMENT_TYPES.find((item) => item.key === value);
    if (!next) return;
    setTypeKey(next.key);
    setTitle(next.title);
    setProvider(next.provider);
    if (!next.expires) setValidUntil("");
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setTypeKey("cv");
      setTitle(PERSONNEL_DOCUMENT_TYPES[0].title);
      setProvider(PERSONNEL_DOCUMENT_TYPES[0].provider);
      setIssuedAt(new Date().toISOString().split("T")[0]);
      setValidUntil("");
      setFile(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Upload a CV, diploma or certificate.",
      });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/training/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "The file could not be uploaded. Try again.",
        });
        setLoading(false);
        return;
      }
      const uploaded = await uploadRes.json();
      const proofDocKey = uploaded.key ?? uploaded.fileKey;
      if (!proofDocKey) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "The file could not be stored.",
        });
        setLoading(false);
        return;
      }

      const result = await createTraining({
        tenantId,
        userId,
        courseKey: `${typeKey}-${Date.now()}`,
        title: title.trim(),
        provider: provider.trim() || selectedType.provider,
        completedAt: issuedAt || undefined,
        validUntil: selectedType.expires ? validUntil || undefined : undefined,
        proofDocKey,
        isRequired: false,
      });

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Could not attach document",
          description: result.error || "Try again.",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Document attached",
        description: `${title} is now on ${employeeName}'s file.`,
        className: "bg-green-50 border-green-200",
      });
      handleClose(false);
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Could not attach document",
        description: "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Attach document
          </DialogTitle>
          <DialogDescription>
            Add a CV, diploma or certificate to {employeeName}&apos;s competence file.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document type</Label>
            <Select value={typeKey} onValueChange={handleTypeChange} disabled={loading}>
              <SelectTrigger id="document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONNEL_DOCUMENT_TYPES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-title">Title</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-provider">Issuer / provider</Label>
            <Input
              id="document-provider"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              required
              minLength={2}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="document-issued">Issued</Label>
              <Input
                id="document-issued"
                type="date"
                value={issuedAt}
                max={new Date().toISOString().split("T")[0]}
                onChange={(event) => setIssuedAt(event.target.value)}
                disabled={loading}
              />
            </div>
            {selectedType.expires ? (
              <div className="space-y-2">
                <Label htmlFor="document-valid-until">Valid until</Label>
                <Input
                  id="document-valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                  disabled={loading}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            {file ? (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{file.name}</p>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <Upload className="h-4 w-4" />
                Upload PDF or image
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  disabled={loading}
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Attach to file
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
