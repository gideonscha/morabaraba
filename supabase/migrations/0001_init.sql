-- Morabaraba Phase 1 schema + Phase 2 monetisation skeleton
-- Apply via Supabase MCP `apply_migration`.

-- =====================================================================
-- PROFILES
-- =====================================================================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (char_length(username) between 3 and 15),
  avatar_id int not null default 1 check (avatar_id between 1 and 8),
  region text not null default 'ZA',
  msisdn text unique,
  coins int not null default 0,
  tier text not null default 'free' check (tier in ('free','silver','gold','platinum')),
  active_subscription_id uuid,
  wins int not null default 0,
  losses int not null default 0,
  streak int not null default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
drop policy if exists profiles_read_all on profiles;
create policy profiles_read_all on profiles
  for select using (true);
drop policy if exists profiles_modify_own on profiles;
create policy profiles_modify_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

-- =====================================================================
-- ROOMS + GAME STATES (online PvP)
-- =====================================================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code char(6) unique not null,
  pin char(4),
  player1_id uuid references auth.users,
  player2_id uuid references auth.users,
  status text not null default 'waiting' check (status in ('waiting','active','complete')),
  winner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table rooms enable row level security;
drop policy if exists rooms_read_participants on rooms;
create policy rooms_read_participants on rooms
  for select using (
    status = 'waiting'
    or auth.uid() = player1_id
    or auth.uid() = player2_id
  );
drop policy if exists rooms_insert_self on rooms;
create policy rooms_insert_self on rooms
  for insert with check (auth.uid() = player1_id);
drop policy if exists rooms_update_participants on rooms;
create policy rooms_update_participants on rooms
  for update using (
    auth.uid() = player1_id
    or auth.uid() = player2_id
    or (status = 'waiting' and player2_id is null)
  );

create table if not exists game_states (
  room_id uuid primary key references rooms(id) on delete cascade,
  board jsonb not null,
  phase text not null default 'placing',
  current_player text not null default 'p1',
  pieces_to_place jsonb not null default '{"p1":12,"p2":12}',
  pieces_on_board jsonb not null default '{"p1":0,"p2":0}',
  captured_by jsonb not null default '{"p1":0,"p2":0}',
  removals_pending int not null default 0,
  updated_at timestamptz default now()
);

alter table game_states enable row level security;
drop policy if exists game_states_read_participants on game_states;
create policy game_states_read_participants on game_states
  for select using (
    exists (
      select 1 from rooms r
      where r.id = game_states.room_id
      and (auth.uid() = r.player1_id or auth.uid() = r.player2_id)
    )
  );
drop policy if exists game_states_write_participants on game_states;
create policy game_states_write_participants on game_states
  for all using (
    exists (
      select 1 from rooms r
      where r.id = game_states.room_id
      and (auth.uid() = r.player1_id or auth.uid() = r.player2_id)
    )
  ) with check (
    exists (
      select 1 from rooms r
      where r.id = game_states.room_id
      and (auth.uid() = r.player1_id or auth.uid() = r.player2_id)
    )
  );

-- Make rooms + game_states realtime-broadcast
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table game_states;

-- =====================================================================
-- GAME RESULTS + LEADERBOARD
-- =====================================================================
create table if not exists game_results (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid references profiles(id),
  loser_id uuid references profiles(id),
  is_draw boolean default false,
  game_mode text not null default 'ai_easy' check (
    game_mode in ('ai_easy','ai_medium','ai_hard','local','online','tournament')
  ),
  coin_multiplier numeric not null default 1.0,
  is_ranked boolean default false,
  is_tournament boolean default false,
  tournament_id uuid,
  coins_awarded int default 0,
  played_at timestamptz default now()
);

alter table game_results enable row level security;
drop policy if exists game_results_read on game_results;
create policy game_results_read on game_results
  for select using (true);

create or replace view leaderboard as
select
  p.id,
  p.username,
  p.avatar_id,
  p.tier,
  p.region,
  count(gr.id) filter (where gr.played_at > now() - interval '1 day') as wins_today,
  count(gr.id) filter (where gr.played_at > now() - interval '7 days') as wins_week,
  count(gr.id) as wins_all_time,
  p.streak
from profiles p
left join game_results gr on gr.winner_id = p.id
group by p.id
order by wins_all_time desc;

-- =====================================================================
-- PHASE 2: monetisation skeleton (kept empty in Phase 1)
-- =====================================================================
create table if not exists coin_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  reference_id uuid,
  balance_after int not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_coin_transactions_profile_id on coin_transactions(profile_id);
create index if not exists idx_coin_transactions_created_at on coin_transactions(created_at);

alter table coin_transactions enable row level security;
drop policy if exists coin_transactions_read_own on coin_transactions;
create policy coin_transactions_read_own on coin_transactions
  for select using (auth.uid() = profile_id);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  tier text not null check (tier in ('silver','gold','platinum')),
  status text not null default 'pending' check (status in ('pending','active','cancelled','expired','failed')),
  telco text,
  msisdn text,
  price_amount numeric,
  price_currency text default 'ZAR',
  started_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  external_subscription_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_subscriptions_profile_id on subscriptions(profile_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

alter table subscriptions enable row level security;
drop policy if exists subscriptions_read_own on subscriptions;
create policy subscriptions_read_own on subscriptions
  for select using (auth.uid() = profile_id);

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null default 'ZA',
  entry_fee int not null default 0,
  prize_pool int not null default 0,
  max_players int,
  status text not null default 'upcoming' check (status in ('upcoming','active','complete','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz default now()
);

alter table tournaments enable row level security;
drop policy if exists tournaments_read_all on tournaments;
create policy tournaments_read_all on tournaments
  for select using (true);

create table if not exists tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  entry_paid_at timestamptz default now(),
  final_rank int,
  prize_awarded int default 0,
  unique(tournament_id, profile_id)
);

alter table tournament_entries enable row level security;
drop policy if exists tournament_entries_read_own on tournament_entries;
create policy tournament_entries_read_own on tournament_entries
  for select using (auth.uid() = profile_id);

create table if not exists regional_pricing (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  tier text not null check (tier in ('silver','gold','platinum')),
  price_amount numeric not null,
  price_currency text not null,
  active_from timestamptz default now(),
  active_to timestamptz,
  unique(region, tier, active_from)
);

alter table regional_pricing enable row level security;
drop policy if exists regional_pricing_read_all on regional_pricing;
create policy regional_pricing_read_all on regional_pricing
  for select using (true);

-- =====================================================================
-- COIN AWARD RPC — security definer, atomic
-- =====================================================================
create or replace function award_coins(
  p_profile_id uuid,
  p_amount int,
  p_reason text,
  p_reference_id uuid default null,
  p_metadata jsonb default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  if auth.uid() is null or auth.uid() <> p_profile_id then
    raise exception 'Not authorized';
  end if;
  if p_amount = 0 then
    raise exception 'Amount must be non-zero';
  end if;
  if p_amount < 0 then
    raise exception 'Use spend_coins for negative amounts';
  end if;
  if p_reason not in (
    'win_ai_easy','win_ai_medium','win_ai_hard','win_local','win_online',
    'daily_login','streak_bonus','promotional','refund','adjustment'
  ) then
    raise exception 'Invalid reason: %', p_reason;
  end if;

  update profiles
  set coins = coins + p_amount
  where id = p_profile_id
  returning coins into new_balance;

  insert into coin_transactions (profile_id, amount, reason, reference_id, balance_after, metadata)
  values (p_profile_id, p_amount, p_reason, p_reference_id, new_balance, p_metadata);

  return new_balance;
end;
$$;

revoke all on function award_coins(uuid, int, text, uuid, jsonb) from public;
grant execute on function award_coins(uuid, int, text, uuid, jsonb) to authenticated;
