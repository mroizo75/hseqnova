"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/supabase/admin";
import { createId } from "@/lib/ids";
import { requirePlatformStaff } from "@/lib/require-platform-staff";
import { articlePath, categoryPath } from "@/lib/news/news-content";
import { sanitizeArticleHtml } from "@/lib/news/news-sanitize";
import {
  articleInputSchema,
  categoryInputSchema,
  idSchema,
  type ArticleInput,
  type CategoryInput,
} from "@/lib/validations/news";
import { ARTICLE_STATUSES, type ArticleStatus } from "@/lib/news/news-types";

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

type Editor = { id: string; name: string };

const UNIQUE_VIOLATION = "23505";

function fail(message: string): ActionResult<never> {
  return { success: false, error: message };
}

function toFailure(error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return fail(error.issues[0]?.message ?? "Invalid input");
  }
  if (error && typeof error === "object" && "message" in error) {
    return fail(String((error as { message: unknown }).message));
  }
  return fail(fallback);
}

async function requireNewsEditor(): Promise<Editor | null> {
  const staff = await requirePlatformStaff();
  if (!staff?.isSuperAdmin) {
    return null;
  }
  return { id: staff.id, name: staff.name?.trim() || staff.email.split("@")[0] };
}

function revalidateNews(paths: string[] = []): void {
  revalidatePath("/admin/news");
  revalidatePath("/news");
  revalidatePath("/news/rss.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  for (const path of paths) {
    revalidatePath(path);
  }
}

function resolvePublishedAt(status: ArticleStatus, publishedAt: string): string | null {
  if (publishedAt) {
    return new Date(publishedAt).toISOString();
  }
  return status === "PUBLISHED" ? new Date().toISOString() : null;
}

function toArticleColumns(input: ArticleInput) {
  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: sanitizeArticleHtml(input.content),
    coverImage: input.coverImage || null,
    coverImageAlt: input.coverImage ? input.coverImageAlt : null,
    categoryId: input.categoryId || null,
    status: input.status,
    publishedAt: resolvePublishedAt(input.status, input.publishedAt),
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
  };
}

async function assertSlugFree(table: "BlogPost" | "BlogCategory", slug: string, exceptId?: string) {
  let query = getAdminDb().from(table).select("id").eq("slug", slug);
  if (exceptId) {
    query = query.neq("id", exceptId);
  }
  const { data, error } = await query.limit(1);
  if (error) {
    throw { code: "NEWS_SLUG_LOOKUP_FAILED", message: error.message };
  }
  if (data && data.length > 0) {
    throw { code: "NEWS_SLUG_TAKEN", message: "That URL slug is already in use. Choose another." };
  }
}

async function categorySlugFor(categoryId: string | null): Promise<string | null> {
  if (!categoryId) {
    return null;
  }
  const { data } = await getAdminDb().from("BlogCategory").select("slug").eq("id", categoryId).maybeSingle();
  return data?.slug ? String(data.slug) : null;
}

export async function createArticle(input: ArticleInput): Promise<ActionResult<{ id: string }>> {
  try {
    const editor = await requireNewsEditor();
    if (!editor) {
      return fail("Only super admins can publish news");
    }
    const parsed = articleInputSchema.parse(input);
    await assertSlugFree("BlogPost", parsed.slug);

    const id = createId();
    const now = new Date().toISOString();
    const columns = toArticleColumns(parsed);
    const { error } = await getAdminDb()
      .from("BlogPost")
      .insert({
        id,
        ...columns,
        authorId: editor.id,
        authorName: editor.name,
        createdAt: now,
        updatedAt: now,
      });
    if (error) {
      throw {
        code: error.code === UNIQUE_VIOLATION ? "NEWS_SLUG_TAKEN" : "NEWS_CREATE_FAILED",
        message: error.code === UNIQUE_VIOLATION ? "That URL slug is already in use." : error.message,
      };
    }

    const catSlug = await categorySlugFor(columns.categoryId);
    revalidateNews([articlePath(parsed.slug), ...(catSlug ? [categoryPath(catSlug)] : [])]);
    return { success: true, data: { id } };
  } catch (error) {
    return toFailure(error, "Could not create the article");
  }
}

export async function updateArticle(
  id: string,
  input: ArticleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const editor = await requireNewsEditor();
    if (!editor) {
      return fail("Only super admins can publish news");
    }
    const articleId = idSchema.parse(id);
    const parsed = articleInputSchema.parse(input);
    await assertSlugFree("BlogPost", parsed.slug, articleId);

    const db = getAdminDb();
    const { data: existing, error: loadError } = await db
      .from("BlogPost")
      .select("slug, categoryId, authorName")
      .eq("id", articleId)
      .maybeSingle();
    if (loadError) {
      throw { code: "NEWS_LOAD_FAILED", message: loadError.message };
    }
    if (!existing) {
      return fail("Article not found");
    }

    const columns = toArticleColumns(parsed);
    const { error } = await db
      .from("BlogPost")
      .update({
        ...columns,
        authorName: existing.authorName ?? editor.name,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", articleId);
    if (error) {
      throw { code: "NEWS_UPDATE_FAILED", message: error.message };
    }

    const [newCat, oldCat] = await Promise.all([
      categorySlugFor(columns.categoryId),
      categorySlugFor((existing.categoryId as string | null) ?? null),
    ]);
    revalidateNews(
      [
        articlePath(parsed.slug),
        articlePath(String(existing.slug)),
        `/admin/news/${articleId}`,
        ...(newCat ? [categoryPath(newCat)] : []),
        ...(oldCat ? [categoryPath(oldCat)] : []),
      ]
    );
    return { success: true, data: { id: articleId } };
  } catch (error) {
    return toFailure(error, "Could not save the article");
  }
}

export async function setArticleStatus(
  id: string,
  status: ArticleStatus
): Promise<ActionResult<{ id: string }>> {
  try {
    const editor = await requireNewsEditor();
    if (!editor) {
      return fail("Only super admins can publish news");
    }
    const articleId = idSchema.parse(id);
    const nextStatus = z.enum(ARTICLE_STATUSES).parse(status);

    const db = getAdminDb();
    const { data: existing, error: loadError } = await db
      .from("BlogPost")
      .select("slug, publishedAt")
      .eq("id", articleId)
      .maybeSingle();
    if (loadError) {
      throw { code: "NEWS_LOAD_FAILED", message: loadError.message };
    }
    if (!existing) {
      return fail("Article not found");
    }

    const publishedAt =
      nextStatus === "PUBLISHED" && !existing.publishedAt ? new Date().toISOString() : existing.publishedAt;
    const { error } = await db
      .from("BlogPost")
      .update({ status: nextStatus, publishedAt, updatedAt: new Date().toISOString() })
      .eq("id", articleId);
    if (error) {
      throw { code: "NEWS_STATUS_FAILED", message: error.message };
    }

    revalidateNews([articlePath(String(existing.slug)), `/admin/news/${articleId}`]);
    return { success: true, data: { id: articleId } };
  } catch (error) {
    return toFailure(error, "Could not change the status");
  }
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  try {
    const editor = await requireNewsEditor();
    if (!editor) {
      return fail("Only super admins can delete news");
    }
    const articleId = idSchema.parse(id);
    const db = getAdminDb();
    const { data: existing } = await db.from("BlogPost").select("slug").eq("id", articleId).maybeSingle();
    const { error } = await db.from("BlogPost").delete().eq("id", articleId);
    if (error) {
      throw { code: "NEWS_DELETE_FAILED", message: error.message };
    }
    revalidateNews(existing?.slug ? [articlePath(String(existing.slug))] : []);
    return { success: true };
  } catch (error) {
    return toFailure(error, "Could not delete the article");
  }
}

export async function upsertCategory(
  id: string | null,
  input: CategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const editor = await requireNewsEditor();
    if (!editor) {
      return fail("Only super admins can manage categories");
    }
    const parsed = categoryInputSchema.parse(input);
    const categoryId = id ? idSchema.parse(id) : null;
    await assertSlugFree("BlogCategory", parsed.slug, categoryId ?? undefined);

    const db = getAdminDb();
    const now = new Date().toISOString();
    const columns = {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description || null,
      updatedAt: now,
    };

    if (categoryId) {
      const { error } = await db.from("BlogCategory").update(columns).eq("id", categoryId);
      if (error) {
        throw {
          code: "NEWS_CATEGORY_UPDATE_FAILED",
          message: error.code === UNIQUE_VIOLATION ? "A category with that name already exists." : error.message,
        };
      }
      revalidateNews([categoryPath(parsed.slug), "/admin/news/categories"]);
      return { success: true, data: { id: categoryId } };
    }

    const newId = createId();
    const { error } = await db.from("BlogCategory").insert({ id: newId, ...columns, createdAt: now });
    if (error) {
      throw {
        code: "NEWS_CATEGORY_CREATE_FAILED",
        message: error.code === UNIQUE_VIOLATION ? "A category with that name already exists." : error.message,
      };
    }
    revalidateNews([categoryPath(parsed.slug), "/admin/news/categories"]);
    return { success: true, data: { id: newId } };
  } catch (error) {
    return toFailure(error, "Could not save the category");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const editor = await requireNewsEditor();
    if (!editor) {
      return fail("Only super admins can manage categories");
    }
    const categoryId = idSchema.parse(id);
    const db = getAdminDb();

    const { error: detachError } = await db
      .from("BlogPost")
      .update({ categoryId: null })
      .eq("categoryId", categoryId);
    if (detachError) {
      throw { code: "NEWS_CATEGORY_DETACH_FAILED", message: detachError.message };
    }

    const { error } = await db.from("BlogCategory").delete().eq("id", categoryId);
    if (error) {
      throw { code: "NEWS_CATEGORY_DELETE_FAILED", message: error.message };
    }
    revalidateNews(["/admin/news/categories"]);
    return { success: true };
  } catch (error) {
    return toFailure(error, "Could not delete the category");
  }
}
