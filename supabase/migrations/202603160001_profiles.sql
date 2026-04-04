-- Profiles schema migration (file-managed)
-- Applies to both fresh DBs and existing DBs where profiles may already exist.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  account_id text not null unique,
  avatar_url text,
  bio text,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

-- Normalize existing data before adding lowercase constraints.
update public.profiles
set account_id = lower(account_id)
where account_id <> lower(account_id);

-- Ensure account_id is lowercase only.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_id_lower_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_id_lower_chk
      check (account_id = lower(account_id));
  end if;
end $$;

-- Ensure account_id format is [a-z0-9_]+.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_account_id_format_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_account_id_format_chk
      check (account_id ~ '^[a-z0-9_]+$');
  end if;
end $$;

-- Restrict role to MVP value.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_member_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_member_chk
      check (role = 'member');
  end if;
end $$;

-- Keep account_id normalized on future writes.
create or replace function public.normalize_account_id()
returns trigger
language plpgsql
as $$
begin
  new.account_id := lower(new.account_id);
  return new;
end;
$$;

drop trigger if exists trg_profiles_normalize_account_id on public.profiles;

create trigger trg_profiles_normalize_account_id
before insert or update of account_id on public.profiles
for each row
execute function public.normalize_account_id();
