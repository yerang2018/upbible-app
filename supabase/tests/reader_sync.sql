-- 실제 사용자 계정은 사용하지 않으며 임시 검증 행은 전부 rollback 합니다.
begin;
select set_config('upbible_test.user_a', gen_random_uuid()::text, true);
select set_config('upbible_test.user_b', gen_random_uuid()::text, true);
insert into auth.users (id) values (current_setting('upbible_test.user_a')::uuid), (current_setting('upbible_test.user_b')::uuid);
select set_config('request.jwt.claim.sub', current_setting('upbible_test.user_a'), true);
set local role authenticated;
do $$
declare a uuid := current_setting('upbible_test.user_a')::uuid;
b uuid := current_setting('upbible_test.user_b')::uuid;
n bigint;
r bigint;
bad_allowed boolean := false;
begin
  select revision into r from public.write_reader_record(0, '{"position":"GEN.1.1","bookmarks":[],"likes":[],"fontLevel":3,"comments":[]}'::jsonb, a);
  if r is distinct from 1 then raise exception 'first write failed'; end if;
  select count(*) into n from public.write_reader_record(0, '{}'::jsonb, a);
  if n <> 0 then raise exception 'stale insert was allowed'; end if;
  select revision into r from public.write_reader_record(1, '{}'::jsonb, a);
  if r is distinct from 2 then raise exception 'revision update failed'; end if;
  select count(*) into n from public.write_reader_record(1, '{}'::jsonb, a);
  if n <> 0 then raise exception 'stale update was allowed'; end if;
  begin
    perform public.write_reader_record(0, '{}'::jsonb, b);
    bad_allowed := true;
  exception when raise_exception then null; end;
  if bad_allowed then raise exception 'cross-account write allowed'; end if;
end $$;
reset role;
insert into public.reader_records (user_id, record) values (current_setting('upbible_test.user_b')::uuid, '{}'::jsonb);
set local role authenticated;
do $$
declare n bigint; bad_allowed boolean := false;
begin
  select count(*) into n from public.reader_records;
  if n <> 1 then raise exception 'RLS failed'; end if;
  begin
    perform public.delete_own_reader_account(current_setting('upbible_test.user_b')::uuid);
    bad_allowed := true;
  exception when raise_exception then null; end;
  if bad_allowed then raise exception 'cross-account delete allowed'; end if;
  perform public.delete_own_reader_account(current_setting('upbible_test.user_a')::uuid);
end $$;
reset role;
do $$
begin
  if exists(select 1 from auth.users where id=current_setting('upbible_test.user_a')::uuid) then raise exception 'own deletion failed'; end if;
  if exists(select 1 from public.reader_records where user_id=current_setting('upbible_test.user_a')::uuid) then raise exception 'cascade failed'; end if;
  if not exists(select 1 from auth.users where id=current_setting('upbible_test.user_b')::uuid) then raise exception 'other user deleted'; end if;
  if has_function_privilege('anon','public.write_reader_record(bigint,jsonb,uuid)','execute') then raise exception 'anonymous write permitted'; end if;
  if has_function_privilege('anon','public.delete_own_reader_account(uuid)','execute') then raise exception 'anonymous delete permitted'; end if;
end $$;
rollback;
select 'reader sync authorization, revision and self-deletion checks passed; fixtures rolled back' as verification;
