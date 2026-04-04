-- account_id rule update:
-- - variable length up to 14 chars
-- - keep lowercase + [a-z0-9_]
-- - use shorter default account_id for new users

-- 1) Align existing data to lowercase.
update public.profiles
set account_id = lower(account_id)
where account_id <> lower(account_id);

-- 2) Replace format check to enforce max length (1..14).
alter table public.profiles
drop constraint if exists profiles_account_id_format_chk;

alter table public.profiles
add constraint profiles_account_id_format_chk
check (account_id ~ '^[a-z0-9_]{1,14}$');

-- 3) Recreate default account_id generator with shorter output.
-- Pattern: u_ + 8 hex chars => 10 chars total.
create or replace function public.generate_default_account_id()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := 'u_' || lower(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

    exit when not exists (
      select 1
      from public.profiles
      where account_id = candidate
    );
  end loop;

  return candidate;
end;
$$;

-- 4) Ensure auth signup uses the new short generator.
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
