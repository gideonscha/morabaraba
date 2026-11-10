-- =====================================================================
-- 0008: Per-service subscription tracking
--
-- Jeremy (10 Nov 2026): on the Games bundle the notification `client`
-- (and landing-page `cl`) is one of 14 bundle service names
-- (Bundle_Games_D, Bundle_My_W, …), and one subscriber may be on more
-- than one. wbi_subscribers keeps ONE row per number, so an unsubscribe
-- from one bundle would have locked out a player still on another.
--
-- This table holds one row per (number, service). wbi-notify maintains
-- it and derives wbi_subscribers.status = active if ANY service is
-- active. The access gate keeps keying on the number.
-- =====================================================================
create table if not exists wbi_subscriber_services (
  msisdn text not null,
  service text not null,
  operator text,
  status text not null default 'active' check (status in ('active','unsubscribed')),
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  updated_at timestamptz default now(),
  primary key (msisdn, service)
);
create index if not exists idx_wbi_subscriber_services_msisdn on wbi_subscriber_services(msisdn);
alter table wbi_subscriber_services enable row level security;
drop policy if exists wbi_subscriber_services_read_admin on wbi_subscriber_services;
create policy wbi_subscriber_services_read_admin on wbi_subscriber_services
  for select using (is_admin());

-- Backfill from the current single-row state.
insert into wbi_subscriber_services (msisdn, service, operator, status, subscribed_at, unsubscribed_at, updated_at)
select msisdn, coalesce(service, 'unknown'), operator,
       case when status = 'active' then 'active' else 'unsubscribed' end,
       subscribed_at, unsubscribed_at, updated_at
from wbi_subscribers
on conflict (msisdn, service) do nothing;
