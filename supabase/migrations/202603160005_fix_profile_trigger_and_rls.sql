-- Comprehensive fix for auth signup profile creation.
-- Addresses:
--   1) Existing account_ids longer than 14 chars (from migration 003).
--   2) Constraint state that may be inconsistent after partial migration 004.
--   3) generate_default_account_id needs SECURITY DEFINER so it can query
--      public.profiles even when called in restricted security contexts.
--   4) Explicit RLS policies for profiles so INSERT from trigger is not blocked.

-- 1) Shorten any existing account_ids that exceed 14 chars (from UUID-derived IDs).
--    Regenerate short IDs using the same hex approach to stay within constraint.
do $$
declare
  r record;
  short_id text;
begin
  for r in
    select id from public.profiles where length(account_id) > 14
  loop
    loop
      short_id := 'u_' || lower(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
      exit when not exists (
        select 1 from public.profiles where account_id = short_id
      );
    end loop;
    update public.profiles set account_id = short_id where id = r.id;
  end loop;
end $$;

-- 2) Re-apply constraints cleanly.
alter table public.profiles
  drop constraint if exists profiles_account_id_lower_chk,
  drop constraint if exists profiles_account_id_format_chk;

alter table public.profiles
  add constraint profiles_account_id_lower_chk
    check (account_id = lower(account_id)),
  add constraint profiles_account_id_format_chk
    check (account_id ~ '^[a-z0-9_]{1,14}$');

-- 3) generate_default_account_id as SECURITY DEFINER so it can always query profiles.
create or replace function public.generate_default_account_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'u_' || lower(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

    exit when not exists (
      select 1 from public.profiles where account_id = candidate
    );
  end loop;

  return candidate;
end;
$$;

-- 4) Recreate handle_new_user with the correct generator.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    account_id,
    avatar_url,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'user'
    ),
    public.generate_default_account_id(),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    'member'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 5) Ensure RLS is enabled and minimal policies exist so INSERT is never blocked.
alter table public.profiles enable row level security;

-- Allow anyone to read public profile fields (display_name, account_id).
drop policy if exists "profiles: public read" on public.profiles;
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Allow authenticated users to insert their own profile.
drop policy if exists "profiles: self insert" on public.profiles;
create policy "profiles: self insert"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Allow authenticated users to update their own profile.
drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Allow authenticated users to delete their own profile.
drop policy if exists "profiles: self delete" on public.profiles;
create policy "profiles: self delete"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());
