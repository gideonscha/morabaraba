-- =====================================================================
-- 0006: Crash telemetry from the game's ErrorBoundary
-- Anyone may insert (anon players included); only admins may read.
-- =====================================================================
create table if not exists client_errors (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  component_stack text,
  error_stack text,
  url text,
  user_agent text,
  profile_id uuid,
  app_commit text,
  context jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_client_errors_created_at on client_errors(created_at desc);
alter table client_errors enable row level security;
drop policy if exists client_errors_insert_any on client_errors;
create policy client_errors_insert_any on client_errors
  for insert to anon, authenticated with check (char_length(message) <= 2000);
drop policy if exists client_errors_read_admin on client_errors;
create policy client_errors_read_admin on client_errors
  for select using (is_admin());
