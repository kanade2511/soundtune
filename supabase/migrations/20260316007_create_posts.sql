-- posts テーブル作成
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  article_id text not null unique check (article_id ~ '^[A-Za-z0-9]{14}$'),
  preview_token text unique,
  title text not null,
  content text not null,
  published boolean not null default true,
  approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 自動更新トリガー
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- RLS 有効化
alter table public.posts enable row level security;

-- 誰でも公開記事を閲覧可能
create policy "公開記事は誰でも閲覧可能"
  on public.posts
  for select
  using (published = true and approval_status = 'approved');

-- ログインユーザーは投稿可能
create policy "ログインユーザーは投稿可能"
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- 投稿者本人のみ更新可能
create policy "投稿者本人のみ更新可能"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- 投稿者本人のみ削除可能
create policy "投稿者本人のみ削除可能"
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = author_id);
