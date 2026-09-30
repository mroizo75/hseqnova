"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/admin/image-uploader";
import { TipTapEditor } from "@/components/admin/tiptap-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { articlePath, slugify } from "@/lib/news/news-content";
import { ARTICLE_STATUS_LABELS, type ArticleStatus, type NewsArticle, type NewsCategory } from "@/lib/news/news-types";
import { SITE_CONFIG } from "@/lib/seo-config";
import { cn } from "@/lib/utils";
import { articleInputSchema, NEWS_LIMITS, type ArticleInput } from "@/lib/validations/news";
import {
  createArticle,
  deleteArticle,
  setArticleStatus,
  updateArticle,
} from "@/server/actions/news.actions";

type ArticleFormProps = {
  article?: NewsArticle;
  categories: NewsCategory[];
};

const NO_CATEGORY = "none";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

function defaultValues(article?: NewsArticle): ArticleInput {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    coverImage: article?.coverImage ?? "",
    coverImageAlt: article?.coverImageAlt ?? "",
    categoryId: article?.category?.id ?? "",
    status: article?.status ?? "DRAFT",
    publishedAt: toLocalInput(article?.publishedAt ?? null),
    metaTitle: article?.metaTitle ?? "",
    metaDescription: article?.metaDescription ?? "",
  };
}

function CharCount({ value, max, min }: { value: string; max: number; min?: number }) {
  const length = value.trim().length;
  const tooShort = min !== undefined && length > 0 && length < min;
  return (
    <span className={cn("text-xs tabular-nums", length > max || tooShort ? "text-destructive" : "text-muted-foreground")}>
      {length}/{max}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

function statusVariant(status: ArticleStatus): "default" | "secondary" | "outline" {
  if (status === "PUBLISHED") return "default";
  if (status === "DRAFT") return "secondary";
  return "outline";
}

export function ArticleForm({ article, categories }: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [pendingAction, setPendingAction] = useState<"draft" | "publish" | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleInputSchema),
    defaultValues: defaultValues(article),
  });

  const [title, slug, excerpt, coverImage, metaTitle, metaDescription, publishedAt] = watch([
    "title",
    "slug",
    "excerpt",
    "coverImage",
    "metaTitle",
    "metaDescription",
    "publishedAt",
  ]);

  const isScheduled = publishedAt !== "" && new Date(publishedAt).getTime() > Date.now();
  const snippetTitle = `${metaTitle.trim() || title.trim() || "Article title"} | ${SITE_CONFIG.name}`;
  const snippetDescription = metaDescription.trim() || excerpt.trim() || "The summary appears here in search results.";
  const siteHost = SITE_CONFIG.url.replace(/^https?:\/\//, "");

  const submit = (status: ArticleStatus, action: "draft" | "publish") =>
    handleSubmit((values) => {
      setPendingAction(action);
      startTransition(async () => {
        const payload: ArticleInput = { ...values, status, publishedAt: fromLocalInput(values.publishedAt) };
        const result = article ? await updateArticle(article.id, payload) : await createArticle(payload);
        setPendingAction(null);

        if (!result.success || !result.data) {
          toast.error("Could not save the article", { description: result.error });
          return;
        }
        toast.success(status === "PUBLISHED" ? (isScheduled ? "Article scheduled" : "Article published") : "Draft saved");
        if (article) {
          router.refresh();
        } else {
          router.push(`/admin/news/${result.data.id}`);
        }
      });
    });

  const handleArchive = () => {
    if (!article) return;
    startTransition(async () => {
      const result = await setArticleStatus(article.id, "ARCHIVED");
      if (!result.success) {
        toast.error("Could not archive the article", { description: result.error });
        return;
      }
      toast.success("Article archived");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!article) return;
    startTransition(async () => {
      const result = await deleteArticle(article.id);
      if (!result.success) {
        toast.error("Could not delete the article", { description: result.error });
        return;
      }
      toast.success("Article deleted");
      router.push("/admin/news");
    });
  };

  const titleField = register("title", {
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (!slugTouched) {
        setValue("slug", slugify(event.target.value), { shouldValidate: false, shouldDirty: true });
      }
    },
  });

  const publishLabel = article?.status === "PUBLISHED" ? "Update" : isScheduled ? "Schedule" : "Publish";

  return (
    <form onSubmit={(event) => event.preventDefault()} className="space-y-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {article ? <Badge variant={statusVariant(article.status)}>{ARTICLE_STATUS_LABELS[article.status]}</Badge> : null}
          {isDirty ? <span className="text-sm text-muted-foreground">Unsaved changes</span> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {article ? (
            <Button asChild variant="outline" className="bg-transparent text-foreground">
              <Link href={`/admin/news/${article.id}/preview`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="bg-transparent text-foreground"
            disabled={isPending}
            onClick={submit("DRAFT", "draft")}
          >
            {pendingAction === "draft" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save draft
          </Button>
          <Button type="button" disabled={isPending} onClick={submit("PUBLISHED", "publish")}>
            {pendingAction === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {publishLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Title</Label>
                  <CharCount value={title} max={NEWS_LIMITS.titleMax} />
                </div>
                <Input id="title" {...titleField} placeholder="How to report an accident under RIDDOR" aria-invalid={Boolean(errors.title)} />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <div className="flex items-center rounded-md border bg-muted/40 pl-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
                  <span className="whitespace-nowrap">/news/</span>
                  <Input
                    id="slug"
                    {...register("slug", { onChange: () => setSlugTouched(true) })}
                    className="border-0 bg-transparent pl-0.5 text-foreground shadow-none focus-visible:ring-0"
                    aria-invalid={Boolean(errors.slug)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Changing the slug of a published article breaks existing links to it.
                </p>
                <FieldError message={errors.slug?.message} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt">Summary</Label>
                  <CharCount value={excerpt} max={NEWS_LIMITS.excerptMax} min={NEWS_LIMITS.excerptMin} />
                </div>
                <Textarea
                  id="excerpt"
                  rows={3}
                  {...register("excerpt")}
                  placeholder="Two or three sentences that answer the reader's question directly."
                  aria-invalid={Boolean(errors.excerpt)}
                />
                <p className="text-xs text-muted-foreground">
                  Shown under the title, on article cards and as the default search description.
                </p>
                <FieldError message={errors.excerpt?.message} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>Article body</Label>
            <Controller
              control={control}
              name="content"
              render={({ field }) => <TipTapEditor content={field.value} onChange={field.onChange} />}
            />
            <p className="text-xs text-muted-foreground">
              Use Heading 2 for main sections. Cite the regulation (e.g. RIDDOR 2013 reg. 4) and link to
              legislation.gov.uk or HSE.gov.uk.
            </p>
            <FieldError message={errors.content?.message} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Publish date and time</Label>
                <Input id="publishedAt" type="datetime-local" {...register("publishedAt")} aria-invalid={Boolean(errors.publishedAt)} />
                <p className="text-xs text-muted-foreground">
                  {isScheduled
                    ? "Scheduled: the article goes live automatically at this time."
                    : "Leave empty to publish immediately."}
                </p>
                <FieldError message={errors.publishedAt?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value || NO_CATEGORY}
                      onValueChange={(value) => field.onChange(value === NO_CATEGORY ? "" : value)}
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Link href="/admin/news/categories" className="text-xs text-primary hover:underline">
                  Manage categories
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cover image</CardTitle>
              <CardDescription>Used on the article, article cards and social shares.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploader
                currentImage={coverImage || undefined}
                onUploadComplete={(url) => setValue("coverImage", url, { shouldDirty: true, shouldValidate: true })}
                onRemove={() => {
                  setValue("coverImage", "", { shouldDirty: true });
                  setValue("coverImageAlt", "", { shouldDirty: true });
                }}
              />
              <FieldError message={errors.coverImage?.message} />
              {coverImage ? (
                <div className="space-y-2">
                  <Label htmlFor="coverImageAlt">Alt text</Label>
                  <Input
                    id="coverImageAlt"
                    {...register("coverImageAlt")}
                    placeholder="Site manager reviewing a RIDDOR report on a tablet"
                    aria-invalid={Boolean(errors.coverImageAlt)}
                  />
                  <FieldError message={errors.coverImageAlt?.message} />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search appearance</CardTitle>
              <CardDescription>Optional. Defaults to the title and summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle">SEO title</Label>
                  <CharCount value={metaTitle} max={NEWS_LIMITS.metaTitleMax} />
                </div>
                <Input id="metaTitle" {...register("metaTitle")} aria-invalid={Boolean(errors.metaTitle)} />
                <FieldError message={errors.metaTitle?.message} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaDescription">SEO description</Label>
                  <CharCount value={metaDescription} max={NEWS_LIMITS.metaDescriptionMax} />
                </div>
                <Textarea id="metaDescription" rows={3} {...register("metaDescription")} aria-invalid={Boolean(errors.metaDescription)} />
                <FieldError message={errors.metaDescription?.message} />
              </div>

              <div className="rounded-md border bg-white p-4" aria-label="Search result preview">
                <p className="truncate text-xs text-[#4d5156]">
                  {siteHost} › news › {slug || "article-slug"}
                </p>
                <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{snippetTitle}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{snippetDescription}</p>
              </div>
            </CardContent>
          </Card>

          {article ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manage</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {article.status === "PUBLISHED" ? (
                  <Button asChild variant="outline" className="justify-start bg-transparent text-foreground">
                    <Link href={articlePath(article.slug)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View live article
                    </Link>
                  </Button>
                ) : null}
                {article.status !== "ARCHIVED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start bg-transparent text-foreground"
                    disabled={isPending}
                    onClick={handleArchive}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive (hide from the site)
                  </Button>
                ) : null}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="justify-start" disabled={isPending}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete article
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this article?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &ldquo;{article.title}&rdquo; will be removed permanently and its URL will return 404.
                        Archive it instead if you may need it again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </form>
  );
}
