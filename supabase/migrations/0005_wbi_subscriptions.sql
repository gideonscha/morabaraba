-- =====================================================================
-- 0005: Worldplay WBI subscription integration
--
-- Inbound notifications (tnSubscribe / sdResult / tnUnsubscribe /
-- soiResult / rechargeResult) land on the wbi-notify Edge Function,
-- which writes every message verbatim to wbi_events and maintains the
-- per-MSISDN view in wbi_subscribers. Both tables are service-role
-- only; the game never reads them directly.
-- =====================================================================

-- Secrets the Edge Functions read via the service role. RLS with no
-- policies = invisible to anon/authenticated clients.
create table if not exists integration_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
alter table integration_secrets enable row level security;

-- Raw, append-only log of every notification received.
create table if not exists wbi_events (
  id uuid primary key default gen_random_uuid(),
  mt text not null,                 -- message type: tnSubscribe, sdResult, ...
  msisdn text,
  service text,                     -- WBI "client" param = service name
  operator text,
  request_id text,
  ref_id text,
  status_id int,
  status_message text,
  amount_cents int,
  payload jsonb not null,           -- every param as received
  source_ip text,
  received_at timestamptz default now()
);
create index if not exists idx_wbi_events_msisdn on wbi_events(msisdn);
create index if not exists idx_wbi_events_received_at on wbi_events(received_at desc);
alter table wbi_events enable row level security;
drop policy if exists wbi_events_read_admin on wbi_events;
create policy wbi_events_read_admin on wbi_events
  for select using (is_admin());

-- Current subscription state per MSISDN.
create table if not exists wbi_subscribers (
  msisdn text primary key,
  service text,
  operator text,
  status text not null default 'pending'
    check (status in ('pending','active','unsubscribed')),
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_source text,
  last_bill_at timestamptz,
  last_bill_status int,
  last_bill_amount_cents int,
  dep_subscription_id text,
  profile_id uuid references profiles(id),   -- linked when the player arrives via Content/Return URL
  updated_at timestamptz default now()
);
alter table wbi_subscribers enable row level security;
drop policy if exists wbi_subscribers_read_admin on wbi_subscribers;
create policy wbi_subscribers_read_admin on wbi_subscribers
  for select using (is_admin());
