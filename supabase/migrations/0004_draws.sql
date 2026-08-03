-- =====================================================================
-- 0004: Prize draws, entries, and payouts
--
-- Client-confirmed rules:
--  * 1 entry into EACH pool (daily / weekly / grand) per 10 coins
--    earned, capped at 20 entries per day.
--  * Daily draw closes 23:59 SAST nightly; weekly Sunday night;
--    grand on the last day of the month. Midnight = period boundary.
--  * Winners picked randomly, weighted by entries. Prizes: airtime.
--
-- Design: entries are DERIVED from the coin ledger at draw time — no
-- entry counters to maintain or corrupt. All period maths uses
-- Africa/Johannesburg local dates.
-- =====================================================================

-- Reasons that earn draw entries (excludes admin adjustments, refunds,
-- and prize payouts themselves).
create or replace function entry_earning_reasons()
returns text[]
language sql immutable
as $$
  select array[
    'win_ai_easy','win_ai_medium','win_ai_hard','win_local','win_online',
    'draw_match','herd_care','daily_login','streak_bonus','promotional'
  ];
$$;

-- Per-player, per-SA-day entry accrual: floor(coins/10) capped at 20.
create or replace view entry_accrual_daily as
select
  profile_id,
  (created_at at time zone 'Africa/Johannesburg')::date as za_day,
  least(20, (sum(amount) / 10)::int) as entries
from coin_transactions
where amount > 0
  and reason = any (entry_earning_reasons())
group by profile_id, (created_at at time zone 'Africa/Johannesburg')::date;

-- Period keys: daily 'YYYY-MM-DD' | weekly ISO 'IYYY-Wxx' | grand 'YYYY-MM'
create or replace function period_key_for(p_kind text, p_day date)
returns text
language sql immutable
as $$
  select case p_kind
    when 'daily'  then to_char(p_day, 'YYYY-MM-DD')
    when 'weekly' then to_char(p_day, 'IYYY"-W"IW')
    when 'grand'  then to_char(p_day, 'YYYY-MM')
  end;
$$;

-- Entries per player for one pool period.
create or replace function entries_for_period(p_kind text, p_period text)
returns table (profile_id uuid, entries bigint)
language sql
security definer
set search_path = public
stable
as $$
  select a.profile_id, sum(a.entries)::bigint
  from entry_accrual_daily a
  where period_key_for(p_kind, a.za_day) = p_period
  group by a.profile_id
  having sum(a.entries) > 0;
$$;

-- Game-facing: the signed-in player's live entry counts for the three
-- currently-open periods.
create or replace function my_draw_entries()
returns table (daily bigint, weekly bigint, grand bigint)
language sql
security definer
set search_path = public
stable
as $$
  with za_today as (
    select (now() at time zone 'Africa/Johannesburg')::date as d
  )
  select
    coalesce((select e.entries from za_today t
      cross join lateral entries_for_period('daily',  period_key_for('daily',  t.d)) e
      where e.profile_id = auth.uid()), 0),
    coalesce((select e.entries from za_today t
      cross join lateral entries_for_period('weekly', period_key_for('weekly', t.d)) e
      where e.profile_id = auth.uid()), 0),
    coalesce((select e.entries from za_today t
      cross join lateral entries_for_period('grand',  period_key_for('grand',  t.d)) e
      where e.profile_id = auth.uid()), 0);
$$;

grant execute on function my_draw_entries() to authenticated;

-- ---------------------------------------------------------------------
-- Draws + payouts
-- ---------------------------------------------------------------------
create table if not exists draws (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('daily','weekly','grand')),
  period_key text not null,
  prize_rand int not null,
  status text not null default 'drawn' check (status in ('drawn','void')),
  seed text not null,
  total_entries bigint not null,
  total_participants int not null,
  winner_profile_id uuid references profiles(id),
  winner_entries bigint,
  drawn_by uuid,
  drawn_at timestamptz default now(),
  unique (kind, period_key)
);

alter table draws enable row level security;
drop policy if exists draws_read_admin on draws;
create policy draws_read_admin on draws
  for select using (is_admin());

create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid references draws(id),
  profile_id uuid not null references profiles(id),
  amount_rand int not null,
  method text not null default 'airtime',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','cancelled')),
  note text,
  worldplay_request_id text,
  worldplay_status_id int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table payouts enable row level security;
drop policy if exists payouts_read_admin on payouts;
create policy payouts_read_admin on payouts
  for select using (is_admin());
drop policy if exists payouts_read_own on payouts;
create policy payouts_read_own on payouts
  for select using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------
-- Draw execution — admin-only, deterministic given the recorded seed
-- ---------------------------------------------------------------------
create or replace function execute_draw(p_kind text, p_period text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_participants int;
  v_seed text;
  v_target bigint;
  v_cum bigint := 0;
  v_winner uuid;
  v_winner_entries bigint;
  v_prize int;
  v_draw_id uuid;
  v_username text;
  r record;
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_kind not in ('daily','weekly','grand') then
    raise exception 'Invalid draw kind';
  end if;
  if exists (select 1 from draws where kind = p_kind and period_key = p_period) then
    raise exception 'Draw already executed for % %', p_kind, p_period;
  end if;
  -- Refuse to draw a period that is still open.
  if p_period = period_key_for(p_kind, (now() at time zone 'Africa/Johannesburg')::date) then
    raise exception 'Period % is still open — draw it after it closes', p_period;
  end if;

  select coalesce(sum(entries), 0), count(*)
  into v_total, v_participants
  from entries_for_period(p_kind, p_period);

  v_prize := coalesce(
    (select (value ->> case p_kind when 'grand' then 'grand' else p_kind end)::int
     from app_config where key = 'prize_values'), 0);

  v_seed := gen_random_uuid()::text;

  if v_total = 0 then
    insert into draws (kind, period_key, prize_rand, status, seed,
                       total_entries, total_participants, drawn_by)
    values (p_kind, p_period, v_prize, 'void', v_seed, 0, 0, auth.uid())
    returning id into v_draw_id;

    insert into audit_log (admin_id, action, target, detail)
    values (auth.uid(), 'draw_void', p_kind || ' ' || p_period,
            jsonb_build_object('reason', 'no entries'));
    return jsonb_build_object('status', 'void', 'draw_id', v_draw_id);
  end if;

  -- Deterministic index in [0, total): first 12 hex chars of
  -- md5(seed|kind|period) interpreted as a number, mod total.
  v_target := ('x' || substr(md5(v_seed || p_kind || p_period), 1, 12))::bit(48)::bigint % v_total;

  for r in
    select profile_id, entries
    from entries_for_period(p_kind, p_period)
    order by profile_id  -- stable order: same seed → same winner
  loop
    v_cum := v_cum + r.entries;
    if v_target < v_cum then
      v_winner := r.profile_id;
      v_winner_entries := r.entries;
      exit;
    end if;
  end loop;

  insert into draws (kind, period_key, prize_rand, seed, total_entries,
                     total_participants, winner_profile_id, winner_entries, drawn_by)
  values (p_kind, p_period, v_prize, v_seed, v_total, v_participants,
          v_winner, v_winner_entries, auth.uid())
  returning id into v_draw_id;

  insert into payouts (draw_id, profile_id, amount_rand)
  values (v_draw_id, v_winner, v_prize);

  select username into v_username from profiles where id = v_winner;

  insert into audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'draw_executed', p_kind || ' ' || p_period,
          jsonb_build_object('winner', v_username, 'winner_id', v_winner,
                             'prize_rand', v_prize, 'seed', v_seed,
                             'total_entries', v_total, 'participants', v_participants));

  return jsonb_build_object(
    'status', 'drawn', 'draw_id', v_draw_id, 'winner_username', v_username,
    'winner_entries', v_winner_entries, 'total_entries', v_total,
    'participants', v_participants, 'prize_rand', v_prize, 'seed', v_seed);
end;
$$;

revoke all on function execute_draw(text, text) from public;
grant execute on function execute_draw(text, text) to authenticated;

-- Pool stats for the admin UI (open or closed periods).
create or replace function admin_pool_stats(p_kind text, p_period text)
returns table (total_entries bigint, participants int)
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(entries), 0), count(*)::int
  from entries_for_period(p_kind, p_period)
  where is_admin();  -- returns empty for non-admins
$$;

grant execute on function admin_pool_stats(text, text) to authenticated;

-- Payout state changes — admin-only, audited.
create or replace function admin_mark_payout(p_id uuid, p_status text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_status not in ('paid','failed','cancelled','pending') then
    raise exception 'Invalid status';
  end if;

  update payouts
  set status = p_status,
      note = coalesce(p_note, note),
      updated_at = now(),
      updated_by = auth.uid()
  where id = p_id;

  if not found then
    raise exception 'Unknown payout';
  end if;

  insert into audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'payout_' || p_status, p_id::text,
          jsonb_build_object('note', p_note));
end;
$$;

revoke all on function admin_mark_payout(uuid, text, text) from public;
grant execute on function admin_mark_payout(uuid, text, text) to authenticated;
