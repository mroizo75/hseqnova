-- Public /news articles on the existing BlogPost / BlogCategory tables.
-- Anonymous visitors may read published articles only; all writes go through the service role.
-- Apply in the Supabase SQL editor. Do not prisma db push.

ALTER TABLE "BlogPost"
  ADD COLUMN IF NOT EXISTS "coverImageAlt" TEXT,
  ADD COLUMN IF NOT EXISTS "authorName" TEXT;

ALTER TABLE "BlogPost" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "BlogCategory" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx"
  ON "BlogPost" ("status", "publishedAt" DESC);

ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogCategory" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_post_public_select ON "BlogPost";
CREATE POLICY blog_post_public_select ON "BlogPost"
  FOR SELECT
  TO anon, authenticated
  USING ("status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL AND "publishedAt" <= now());

DROP POLICY IF EXISTS blog_category_public_select ON "BlogCategory";
CREATE POLICY blog_category_public_select ON "BlogCategory"
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE "BlogPost" TO anon, authenticated;
GRANT SELECT ON TABLE "BlogCategory" TO anon, authenticated;
GRANT ALL ON TABLE "BlogPost" TO service_role;
GRANT ALL ON TABLE "BlogCategory" TO service_role;
