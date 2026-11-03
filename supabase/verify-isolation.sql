-- Run on the dedicated Allowance project after applying schema.sql.
-- Test identities and rows are created only inside this transaction; ROLLBACK removes them.
begin;
insert into auth.users(id,email) values
 ('a1100000-0000-4000-8000-000000000001','allowance-isolation-a@example.invalid'),
 ('a1100000-0000-4000-8000-000000000002','allowance-isolation-b@example.invalid');
insert into public.allowance_workspaces(user_id,document) values
 ('a1100000-0000-4000-8000-000000000001','{"test":"A"}'),
 ('a1100000-0000-4000-8000-000000000002','{"test":"B"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1100000-0000-4000-8000-000000000001',true);
do $$ declare count_rows integer; begin
 select count(*) into count_rows from public.allowance_workspaces;
 if count_rows <> 1 then raise exception 'RLS read isolation failed'; end if;
 update public.allowance_workspaces set revision=2 where user_id='a1100000-0000-4000-8000-000000000002';
 get diagnostics count_rows = row_count;
 if count_rows <> 0 then raise exception 'RLS foreign update isolation failed'; end if;
 begin
  update public.allowance_workspaces set user_id='a1100000-0000-4000-8000-000000000003' where user_id='a1100000-0000-4000-8000-000000000001';
  raise exception 'RLS owner reassignment was allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub','a1100000-0000-4000-8000-000000000002',true);
do $$ declare count_rows integer; begin
 select count(*) into count_rows from public.allowance_workspaces where document->>'test'='B';
 if count_rows <> 1 then raise exception 'Second user cannot read own row'; end if;
 select count(*) into count_rows from public.allowance_workspaces where document->>'test'='A';
 if count_rows <> 0 then raise exception 'Second user can read first user'; end if;
end $$;
reset role;
select 'Ownership select/update/reassignment checks passed; fixtures rolled back.' as result;
rollback;
