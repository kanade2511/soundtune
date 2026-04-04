-- Enable admin role support, bootstrap the first admin, and add role management function.

-- 1) Normalize existing role values.
update public.profiles
set role = 'member'
where role is null or role not in ('member', 'admin');

-- 2) Replace legacy MVP-only role constraint with admin-capable constraint.
alter table public.profiles
  drop constraint if exists profiles_role_member_chk,
  drop constraint if exists profiles_role_valid_chk;

alter table public.profiles
  add constraint profiles_role_valid_chk
  check (role in ('member', 'admin'));

comment on column public.profiles.role is
  'User role. member: regular user, admin: moderation/admin user.';

-- 3) Helper function to check admin privileges.
create or replace function public.is_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- 4) Bootstrap initial admin by fixed UUID (account_id may change).
update public.profiles
set role = 'admin'
where id = '802c5397-09e4-402c-bbff-ea6a33ca319f';

-- 5) Admin-only role management function.
create or replace function public.set_user_role(
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean;
  current_role text;
  admin_count integer;
begin
  if actor_id is null then
    raise exception 'not authenticated';
  end if;

  if new_role not in ('member', 'admin') then
    raise exception 'invalid role';
  end if;

  select exists (
    select 1
    from public.profiles
    where id = actor_id
      and role = 'admin'
  ) into actor_is_admin;

  if not actor_is_admin then
    raise exception 'only admin can change roles';
  end if;

  select role
  from public.profiles
  where id = target_user_id
  into current_role;

  if current_role is null then
    raise exception 'target user not found';
  end if;

  if current_role = 'admin' and new_role = 'member' then
    select count(*)::int
    from public.profiles
    where role = 'admin'
    into admin_count;

    if admin_count <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;
end;
$$;

grant execute on function public.set_user_role(uuid, text) to authenticated;
