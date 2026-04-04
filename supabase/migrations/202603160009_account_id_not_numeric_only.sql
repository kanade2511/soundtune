-- account_id rule update: disallow numeric-only values

alter table public.profiles
drop constraint if exists profiles_account_id_format_chk;

alter table public.profiles
add constraint profiles_account_id_format_chk
check (
  account_id ~ '^[a-z0-9_]{4,14}$'
  and account_id !~ '^[0-9]+$'
);
