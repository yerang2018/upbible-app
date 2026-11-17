-- 2026-11-13 전용 UpBible 프로젝트 적용 및 rollback 기반 권한 검사 통과.
-- 각 사용자는 본인 기록만 읽으며 쓰기는 revision 충돌을 검사하는 함수로만 합니다.
create table if not exists public.reader_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  record jsonb not null check (jsonb_typeof(record) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.reader_records enable row level security;
revoke all on public.reader_records from anon, authenticated;
grant select on public.reader_records to authenticated;

drop policy if exists reader_select_own on public.reader_records;
create policy reader_select_own on public.reader_records
  for select to authenticated using ((select auth.uid()) = user_id);

-- expected_revision=0 means the caller expects no record yet. A null result
-- signals a concurrent update; clients must reload instead of overwriting it.
create or replace function public.write_reader_record(expected_revision bigint, new_record jsonb, expected_user_id uuid)
returns table (revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null or caller is distinct from expected_user_id then raise exception 'authentication required'; end if;
  if expected_revision is null or expected_revision < 0
     or new_record is null or jsonb_typeof(new_record) <> 'object'
     or pg_column_size(new_record) > 1048576 then
    raise exception 'invalid record';
  end if;
  if expected_revision = 0 then
    return query insert into public.reader_records as r (user_id, record)
      values (caller, new_record) on conflict (user_id) do nothing
      returning r.revision, r.updated_at;
  else
    return query update public.reader_records as r
      set record = new_record, revision = r.revision + 1, updated_at = now()
      where r.user_id = caller and r.revision = expected_revision
      returning r.revision, r.updated_at;
  end if;
end;
$$;
revoke all on function public.write_reader_record(bigint, jsonb, uuid) from public, anon;
grant execute on function public.write_reader_record(bigint, jsonb, uuid) to authenticated;

-- 이전 두 인자 함수가 있다면 더 이상 사용하지 않습니다.
drop function if exists public.write_reader_record(bigint, jsonb);

create or replace function public.delete_own_reader_account(expected_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null or caller is distinct from expected_user_id then raise exception 'authentication required'; end if;
  delete from auth.users where id = caller;
  if not found then raise exception 'account not found'; end if;
end;
$$;
revoke all on function public.delete_own_reader_account(uuid) from public, anon;
grant execute on function public.delete_own_reader_account(uuid) to authenticated;
