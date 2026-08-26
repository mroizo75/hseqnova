"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TenantLogoUploadProps {
  currentLogoUrl?: string | null;
  isAdmin: boolean;
}

export function TenantLogoUpload({ currentLogoUrl, isAdmin }: TenantLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleFile(file: File) {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);
    const res = await fetch("/api/settings/logo", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.success) {
      setPreviewUrl(data.logoUrl);
      toast({
        title: "Logo uploaded",
        description: "It will appear on the health and safety policy and other PDFs.",
      });
      router.refresh();
    } else {
      toast({
        title: "Upload failed",
        description: data.error ?? "Could not upload the logo",
        variant: "destructive",
      });
    }
  }

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch("/api/settings/logo", { method: "DELETE" });
    setRemoving(false);
    if (res.ok) {
      setPreviewUrl(null);
      toast({ title: "Logo removed" });
      router.refresh();
    } else {
      toast({ title: "Could not remove logo", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Company logo
        </CardTitle>
        <CardDescription>
          Shown on the written health and safety policy, inspection reports and other PDFs. PNG or
          SVG with a transparent background, max 2 MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-muted/30">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Company logo"
                className="max-h-16 max-w-36 object-contain"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            )}
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="gap-2 bg-transparent"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {previewUrl ? "Replace logo" : "Upload logo"}
              </Button>

              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={removing}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Remove logo
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
