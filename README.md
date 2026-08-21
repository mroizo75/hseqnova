# HSEQ Nova

Health, safety, environment and quality software for UK employers. Production domain: [hseqnova.co.uk](https://hseqnova.co.uk).

## Database

Supabase is used **only** with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser, RLS)
- `SUPABASE_SERVICE_ROLE_KEY` (server)

There is no `DATABASE_URL`. Do not run `prisma db push` against Supabase.

Prisma is schema and TypeScript types only. Apply SQL from `supabase/migrations/` in the Supabase SQL editor (Dashboard → SQL).

```bash
npm install
cp .env.example .env
npx prisma generate
npm run db:sql > supabase/migrations/0001_init.sql
npm run dev
```
