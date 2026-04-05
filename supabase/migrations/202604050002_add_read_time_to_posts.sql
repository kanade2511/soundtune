alter table posts
    add column if not exists read_time integer;

update posts
set read_time = greatest(
    1,
    ceil(char_length(regexp_replace(content, '\s+', '', 'g')) / 500.0)
)::integer
where read_time is null;

alter table posts
    alter column read_time set default 1,
    alter column read_time set not null;
