import { z } from "zod";
import { ARTICLE_STATUSES } from "@/lib/news/news-types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COVER_IMAGE_PATTERN = /^(?:\/api\/files\/blog\/images\/[\w.\-/]+|https:\/\/\S+)$/;

export const NEWS_LIMITS = {
  titleMax: 120,
  slugMax: 120,
  excerptMin: 50,
  excerptMax: 300,
  metaTitleMax: 60,
  metaDescriptionMax: 160,
  altMax: 200,
  contentMax: 200_000,
} as const;

const slugField = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(NEWS_LIMITS.slugMax, `Slug must be ${NEWS_LIMITS.slugMax} characters or fewer`)
  .regex(SLUG_PATTERN, "Use lower-case letters, numbers and single hyphens only");

const isoDateOrEmpty = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Enter a valid date and time");

export const articleInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(NEWS_LIMITS.titleMax, `Title must be ${NEWS_LIMITS.titleMax} characters or fewer`),
    slug: slugField,
    excerpt: z
      .string()
      .trim()
      .min(NEWS_LIMITS.excerptMin, `Summary must be at least ${NEWS_LIMITS.excerptMin} characters`)
      .max(NEWS_LIMITS.excerptMax, `Summary must be ${NEWS_LIMITS.excerptMax} characters or fewer`),
    content: z
      .string()
      .max(NEWS_LIMITS.contentMax, "Article body is too long")
      .refine((html) => html.replace(/<[^>]*>/g, "").trim().length > 0, "Article body is required"),
    coverImage: z
      .string()
      .trim()
      .refine((value) => value === "" || COVER_IMAGE_PATTERN.test(value), "Upload a valid cover image"),
    coverImageAlt: z
      .string()
      .trim()
      .max(NEWS_LIMITS.altMax, `Alt text must be ${NEWS_LIMITS.altMax} characters or fewer`),
    categoryId: z.string().trim(),
    status: z.enum(ARTICLE_STATUSES),
    publishedAt: isoDateOrEmpty,
    metaTitle: z
      .string()
      .trim()
      .max(NEWS_LIMITS.metaTitleMax, `SEO title must be ${NEWS_LIMITS.metaTitleMax} characters or fewer`),
    metaDescription: z
      .string()
      .trim()
      .max(
        NEWS_LIMITS.metaDescriptionMax,
        `SEO description must be ${NEWS_LIMITS.metaDescriptionMax} characters or fewer`
      ),
  })
  .superRefine((value, ctx) => {
    if (value.coverImage !== "" && value.coverImageAlt === "") {
      ctx.addIssue({
        code: "custom",
        path: ["coverImageAlt"],
        message: "Describe the image for screen readers and search engines",
      });
    }
  });

export type ArticleInput = z.infer<typeof articleInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or fewer"),
  slug: slugField,
  description: z.string().trim().max(300, "Description must be 300 characters or fewer"),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const idSchema = z.string().trim().min(1).max(64);
