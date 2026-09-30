"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadComplete: (url: string, key: string) => void;
  onRemove: () => void;
  currentImage?: string;
  className?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUploader({ onUploadComplete, onRemove, currentImage, className }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WebP and GIF images are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The image is too large. The maximum size is 5 MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/blog/upload", { method: "POST", body: formData });
      const body = (await response.json().catch(() => ({}))) as {
        url?: string;
        key?: string;
        message?: string;
      };
      if (!response.ok || !body.url || !body.key) {
        throw new Error(body.message || "Image upload failed");
      }
      setUploadProgress(100);
      onUploadComplete(body.url, body.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
        className="hidden"
      />

      {currentImage ? (
        <div className="group relative overflow-hidden rounded-lg border">
          <Image
            src={currentImage}
            alt="Cover image preview"
            width={1200}
            height={675}
            className="aspect-[16/9] w-full object-cover"
            unoptimized
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Replace
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={onRemove} disabled={isUploading}>
              <X className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a cover image"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
            isDragging && "border-primary bg-primary/5",
            error && "border-destructive"
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && !isUploading) {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {isUploading ? (
            <>
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="mb-2 text-sm text-muted-foreground">Uploading image…</p>
              <Progress value={uploadProgress} className="w-full max-w-xs" />
            </>
          ) : (
            <>
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">Drag an image here, or click to choose one</p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP or GIF, up to 5 MB. Use 1600 × 900 px (16:9) for the best result.
              </p>
            </>
          )}
        </div>
      )}

      {error ? (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <X className="h-4 w-4" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
