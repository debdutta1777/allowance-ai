-- Apply only to the dedicated Allowance project. No service-role key is used by the app.
create table public.allowance_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  document jsonb not null check (jsonb_typeof(document) = 'object' and octet_length(document::text) <= 262144),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.allowance_workspaces enable row level security;
revoke all on public.allowance_workspaces from public, anon, authenticated;
grant select, insert, update, delete on public.allowance_workspaces to authenticated;
create policy "Read own workspace" on public.allowance_workspaces for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own workspace" on public.allowance_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own workspace" on public.allowance_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own workspace" on public.allowance_workspaces for delete to authenticated using ((select auth.uid()) = user_id);
