-- Fix auth signup profile creation failures.
-- Replace trigger function with a version that does not query public.profiles
-- while generating account_id, avoiding permission/RLS-related failures.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_display_name text;
  generated_account_id text;
begin
  generated_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'user'
  );

  -- UUID-derived ID is deterministic and unique per auth user.
  generated_account_id := 'user_' || replace(new.id::text, '-', '');

  insert into public.profiles (
    id,
    display_name,
    account_id,
    avatar_url,
    role
  )
  values (
    new.id,
    generated_display_name,
    generated_account_id,
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
