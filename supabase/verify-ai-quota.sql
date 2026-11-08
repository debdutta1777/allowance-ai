-- Disposable fixtures and counter changes are rolled back. No provider call is made.
begin;
insert into auth.users(id,email) values
('a1100000-0000-4000-8000-000000000011','quota-a@example.invalid'),
('a1100000-0000-4000-8000-000000000012','quota-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','a1100000-0000-4000-8000-000000000011',true);
do $$ begin
  for i in 1..8 loop
    if not public.allowance_admit_ai() then raise exception 'Early denial'; end if;
  end loop;
  if public.allowance_admit_ai() then raise exception 'Minute cap bypass'; end if;
  begin
    perform count(*) from allowance_private.ai_usage;
    raise exception 'Counter read allowed';
  exception when insufficient_privilege then null; end;
  begin
    update allowance_private.ai_usage set day_count=0;
    raise exception 'Counter reset allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
update allowance_private.ai_usage set minute_start=minute_start-interval '1 minute';
set local role authenticated;
do $$ begin if not public.allowance_admit_ai() then raise exception 'Minute reset failed'; end if; end $$;
reset role;
update allowance_private.ai_usage set day_count=40 where user_id='a1100000-0000-4000-8000-000000000011';
set local role authenticated;
do $$ begin if public.allowance_admit_ai() then raise exception 'Daily cap bypass'; end if; end $$;
reset role;
update allowance_private.ai_usage set usage_day=usage_day-1 where user_id='a1100000-0000-4000-8000-000000000011';
set local role authenticated;
do $$ begin if not public.allowance_admit_ai() then raise exception 'Day reset failed'; end if; end $$;
reset role;
update allowance_private.ai_usage set day_count=200 where bucket='global';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1100000-0000-4000-8000-000000000012',true);
do $$ begin if public.allowance_admit_ai() then raise exception 'Global daily cap bypass'; end if; end $$;
reset role;
update allowance_private.ai_usage set day_count=0,minute_count=30 where bucket='global';
set local role authenticated;
do $$ begin if public.allowance_admit_ai() then raise exception 'Global minute cap bypass'; end if; end $$;
reset role;
set local role anon;
do $$ begin
  begin perform public.allowance_admit_ai(); raise exception 'Anonymous admission allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Per-user/global limits, resets and role permissions passed; fixtures rolled back.' as verification;
