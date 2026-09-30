"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/news/news-content";
import { categoryInputSchema, type CategoryInput } from "@/lib/validations/news";
import { deleteCategory, upsertCategory } from "@/server/actions/news.actions";
import type { AdminCategory } from "@/server/queries/news-admin.queries";

type CategoryManagerProps = {
  categories: AdminCategory[];
};

const EMPTY: CategoryInput = { name: "", slug: "", description: "" };

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    defaultValues: EMPTY,
  });

  const startEdit = (category: AdminCategory) => {
    setEditingId(category.id);
    setSlugTouched(true);
    reset({ name: category.name, slug: category.slug, description: category.description ?? "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSlugTouched(false);
    reset(EMPTY);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await upsertCategory(editingId, values);
      if (!result.success) {
        toast.error("Could not save the category", { description: result.error });
        return;
      }
      toast.success(editingId ? "Category updated" : "Category created");
      cancelEdit();
      router.refresh();
    });
  });

  const onDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) {
        toast.error("Could not delete the category", { description: result.error });
        return;
      }
      toast.success("Category deleted");
      if (editingId === id) cancelEdit();
      router.refresh();
    });
  };

  const nameField = register("name", {
    onChange: (event: { target: { value: string } }) => {
      if (!slugTouched) {
        setValue("slug", slugify(event.target.value));
      }
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>{categories.length} categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Articles</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No categories yet
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <p className="font-medium">{category.name}</p>
                      {category.description ? (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{category.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">/news/category/{category.slug}</TableCell>
                    <TableCell className="text-right tabular-nums">{category.articleCount}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => startEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" aria-label={`Delete ${category.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete &ldquo;{category.name}&rdquo;?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {category.articleCount > 0
                                  ? `${category.articleCount} article(s) will stay published without a category.`
                                  : "No articles use this category."}{" "}
                                The category page will return 404.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? "Edit category" : "New category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" {...nameField} placeholder="RIDDOR" aria-invalid={Boolean(errors.name)} />
              {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">URL slug</Label>
              <Input
                id="category-slug"
                {...register("slug", { onChange: () => setSlugTouched(true) })}
                aria-invalid={Boolean(errors.slug)}
              />
              {errors.slug ? <p className="text-sm text-destructive">{errors.slug.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                rows={3}
                {...register("description")}
                placeholder="Shown on the category page and used as its search description."
              />
              {errors.description ? <p className="text-sm text-destructive">{errors.description.message}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Save changes" : "Add category"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" className="bg-transparent text-foreground" onClick={cancelEdit}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
