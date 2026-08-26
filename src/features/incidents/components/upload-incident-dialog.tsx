"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileUp } from "lucide-react";
import { createUploadedIncident } from "@/server/actions/incident.actions";

export function UploadIncidentDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<"INTERNAL" | "EXTERNAL">("EXTERNAL");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setSource("EXTERNAL");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Enter a title for the accident book entry.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("source", source);
      if (file) {
        formData.append("file", file);
      }

      const result = await createUploadedIncident(formData);

      if (result.success) {
        toast({
          title: "Record created",
          description: `"${title}" has been added to the accident book.`,
        });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Could not create the record.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload accident book record</DialogTitle>
          <DialogDescription>
            Create a record with a title and optional file. Details can be completed during handling.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="upload-title">Title</Label>
            <Input
              id="upload-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short description of the incident"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label>Source</Label>
            <Select
              value={source}
              onValueChange={(value) => setSource(value as "INTERNAL" | "EXTERNAL")}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXTERNAL">External (received from outside)</SelectItem>
                <SelectItem value="INTERNAL">Internal (recorded in-house)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="upload-file">File (optional)</Label>
            <div className="mt-1">
              <label
                htmlFor="upload-file"
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 hover:border-primary/50 transition-colors"
              >
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  {file ? (
                    <p className="text-sm font-medium truncate">{file.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click to choose a file (PDF, image, etc.)
                    </p>
                  )}
                </div>
              </label>
              <input
                ref={fileInputRef}
                id="upload-file"
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create record"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
