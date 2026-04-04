# Supabase SQL management

Use SQL files in `supabase/migrations` as the single source of truth.

## Recommended workflow

1. Add a new migration file with a timestamp prefix.
2. Write idempotent SQL where possible.
3. Apply SQL in Supabase SQL Editor (or Supabase CLI if introduced later).
4. Commit migration files with app code changes in the same PR.

## Naming rule

- `YYYYMMDDHHMM_description.sql`

Example:

- `202603160001_profiles.sql`

## Initial migration in this repo

- `202603160001_profiles.sql`: creates/aligns `public.profiles` with MVP rules.
