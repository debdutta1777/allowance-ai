-- Apply only to the dedicated Allowance project. No financial records are touched.
create schema if not exists allowance_private;
revoke all on schema allowance_private from public, anon, authenticated;
grant usage on schema allowance_private to authenticated;
create table allowance_private.ai_usage (
  bucket text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  minute_start timestamptz not null,
  minute_count integer not null default 0 check (minute_count >= 0),
  usage_day date not null,
  day_count integer not null default 0 check (day_count >= 0)
);
alter table allowance_private.ai_usage enable row level security;
revoke all on allowance_private.ai_usage from public, anon, authenticated;

-- Only this narrowly scoped function can mutate counters. Callers cannot reset them.
create function allowance_private.consume_ai_quota()
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  identity uuid := auth.uid();
  moment timestamptz := pg_catalog.clock_timestamp();
  minute_now timestamptz;
  day_now date;
  own_bucket text;
begin
  if identity is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  minute_now := pg_catalog.date_trunc('minute',moment at time zone 'UTC') at time zone 'UTC';
  day_now := (moment at time zone 'UTC')::date;
  own_bucket := 'user:' || identity::text;
  -- One lock serializes admission across instances and prevents check/update races.
  perform pg_catalog.pg_advisory_xact_lock(17539231);
  insert into allowance_private.ai_usage(bucket,user_id,minute_start,usage_day)
  values ('global',null,minute_now,day_now),(own_bucket,identity,minute_now,day_now)
  on conflict (bucket) do nothing;
  update allowance_private.ai_usage
  set minute_count = case when minute_start < minute_now then 0 else minute_count end,
      minute_start = minute_now,
      day_count = case when usage_day < day_now then 0 else day_count end,
      usage_day = day_now
  where bucket in ('global',own_bucket);
  if exists (select 1 from allowance_private.ai_usage where
      (bucket = own_bucket and (minute_count >= 8 or day_count >= 40)) or
      (bucket = 'global' and (minute_count >= 30 or day_count >= 200))) then
    return false;
  end if;
  update allowance_private.ai_usage set minute_count = minute_count + 1, day_count = day_count + 1
  where bucket in ('global',own_bucket);
  return true;
end;
$$;
revoke all on function allowance_private.consume_ai_quota() from public, anon, authenticated;
grant execute on function allowance_private.consume_ai_quota() to authenticated;

create function public.allowance_admit_ai()
returns boolean language sql security invoker set search_path = '' as $$
  select allowance_private.consume_ai_quota();
$$;
revoke all on function public.allowance_admit_ai() from public, anon, authenticated;
grant execute on function public.allowance_admit_ai() to authenticated;
