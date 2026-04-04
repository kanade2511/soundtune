-- Replace gen_random_bytes (requires pgcrypto) with md5(random()) which has no extension dependency.

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
    candidate := 'u_' || substr(md5(random()::text), 1, 8);

    exit when not exists (
      select 1 from public.profiles where account_id = candidate
    );
  end loop;

  return candidate;
end;
$$;

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
