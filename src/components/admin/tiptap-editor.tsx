"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

type ToolbarButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  busy?: boolean;
};

function ToolbarButton({ label, icon: Icon, onClick, active, disabled, busy }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn("h-9 w-9 p-0", active && "bg-muted")}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </Button>
  );
}

function normaliseLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  if (/^(https:\/\/|mailto:|tel:|\/|#)/i.test(value)) {
    return value;
  }
  if (/^http:\/\//i.test(value)) {
    return value.replace(/^http:/i, "https:");
  }
  return `https://${value}`;
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/blog/upload", { method: "POST", body: formData });
  const body = (await response.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!response.ok || !body.url) {
    throw new Error(body.message || "Image upload failed");
  }
  return body.url;
}

function Toolbar({ editor }: { editor: Editor }) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const alt = window.prompt("Describe the image for screen readers and search engines (alt text):")?.trim();
      if (!alt) {
        toast.error("Alt text is required for images");
        return;
      }
      setIsUploadingImage(true);
      try {
        const src = await uploadImage(file);
        editor.chain().focus().setImage({ src, alt }).run();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Image upload failed");
      } finally {
        setIsUploadingImage(false);
      }
    };
    input.click();
  };

  const handleLinkAdd = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const raw = window.prompt("Link address (https://…, /page or mailto:)", previous ?? "");
    if (raw === null) return;
    const href = normaliseLink(raw);
    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 border-b bg-muted/50 p-2" role="toolbar" aria-label="Formatting">
      <ToolbarButton label="Bold" icon={Bold} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton label="Italic" icon={Italic} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton label="Underline" icon={UnderlineIcon} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton label="Strikethrough" icon={Strikethrough} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />

      <Separator orientation="vertical" className="mx-1 h-8" />

      <ToolbarButton label="Heading 2" icon={Heading2} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="Heading 3" icon={Heading3} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <ToolbarButton label="Heading 4" icon={Heading4} active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />

      <Separator orientation="vertical" className="mx-1 h-8" />

      <ToolbarButton label="Bulleted list" icon={List} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton label="Numbered list" icon={ListOrdered} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton label="Quote" icon={Quote} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton label="Divider" icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} />

      <Separator orientation="vertical" className="mx-1 h-8" />

      <ToolbarButton label="Align left" icon={AlignLeft} active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
      <ToolbarButton label="Align centre" icon={AlignCenter} active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
      <ToolbarButton label="Align right" icon={AlignRight} active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />

      <Separator orientation="vertical" className="mx-1 h-8" />

      <ToolbarButton label="Add link" icon={LinkIcon} active={editor.isActive("link")} onClick={handleLinkAdd} />
      <ToolbarButton label="Remove link" icon={Unlink} disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} />
      <ToolbarButton label="Insert image" icon={ImageIcon} busy={isUploadingImage} onClick={handleImageUpload} />
      <ToolbarButton label="Insert table" icon={TableIcon} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />

      <Separator orientation="vertical" className="mx-1 h-8" />

      <ToolbarButton label="Undo" icon={Undo} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton label="Redo" icon={Redo} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Write the article…",
  className,
}: TipTapEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[420px] p-4",
        "aria-label": "Article body",
      },
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !editor) {
    return (
      <div className={cn("overflow-hidden rounded-lg border", className)}>
        <div className="h-[52px] border-b bg-muted/50 p-2" />
        <div className="flex min-h-[420px] items-center justify-center bg-background p-4 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Loading editor…
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Toolbar editor={editor} />
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
