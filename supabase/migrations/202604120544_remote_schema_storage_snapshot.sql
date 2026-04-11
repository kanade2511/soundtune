


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."generate_default_account_id"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."generate_default_account_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("target_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_account_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.account_id := lower(new.account_id);
  return new;
end;
$$;


ALTER FUNCTION "public"."normalize_account_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_role"("target_user_id" "uuid", "new_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."set_user_role"("target_user_id" "uuid", "new_role" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "post_id" "text" NOT NULL,
    "preview_token" "text",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "published" boolean DEFAULT true NOT NULL,
    "approval_status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "thumbnail_url" "text",
    "read_time" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "posts_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "posts_post_id_check" CHECK (("post_id" ~ '^[A-Za-z0-9_-]{14}$'::"text"))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "avatar_url" "text",
    "bio" "text",
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_account_id_format_chk" CHECK ((("account_id" ~ '^[a-z0-9_-]{4,14}$'::"text") AND ("account_id" !~ '^[0-9]+$'::"text"))),
    CONSTRAINT "profiles_account_id_lower_chk" CHECK (("account_id" = "lower"("account_id"))),
    CONSTRAINT "profiles_role_valid_chk" CHECK (("role" = ANY (ARRAY['member'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."role" IS 'User role. member: regular user, admin: moderation/admin user.';



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_preview_token_key" UNIQUE ("preview_token");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "posts_set_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_normalize_account_id" BEFORE INSERT OR UPDATE OF "account_id" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_account_id"();



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles: public read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles: self delete" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles: self insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles: self update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "ログインユーザーは投稿可能" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "公開記事は誰でも閲覧可能" ON "public"."posts" FOR SELECT USING ((("published" = true) AND ("approval_status" = 'approved'::"text")));



CREATE POLICY "投稿者本人のみ削除可能" ON "public"."posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "投稿者本人のみ更新可能" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_default_account_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_default_account_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_default_account_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_account_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_account_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_account_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_role"("target_user_id" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_role"("target_user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_role"("target_user_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";









-- Snapshot of current remote storage bucket settings (data-level config).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('Articles', 'Articles', true, null, null)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('Users', 'Users', true, null, null)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Ensure RLS state and policies for storage.objects match remote.
alter table storage.objects enable row level security;

drop policy if exists "Articles: auth delete article folder" on storage.objects;
create policy "Articles: auth delete article folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

drop policy if exists "Articles: auth insert article folder" on storage.objects;
create policy "Articles: auth insert article folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

drop policy if exists "Articles: auth update article folder" on storage.objects;
create policy "Articles: auth update article folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  )
  with check (
    bucket_id = 'Articles'
    and (storage.foldername(name))[1] ~ '^[A-Za-z0-9_-]{14}$'
  );

drop policy if exists "Articles: public read" on storage.objects;
create policy "Articles: public read"
  on storage.objects for select
  using (bucket_id = 'Articles');

drop policy if exists "Users: auth delete own folder" on storage.objects;
create policy "Users: auth delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users: auth insert own folder" on storage.objects;
create policy "Users: auth insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users: auth update own folder" on storage.objects;
create policy "Users: auth update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'Users'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "Users: public read" on storage.objects;
create policy "Users: public read"
  on storage.objects for select
  using (bucket_id = 'Users');
