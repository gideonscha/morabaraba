-- =====================================================================
-- 0007: Instance (brand) tagging — separate operator pools and tallies
--
-- Jacqui (27 Oct 2026): MTN and Telkom airtime spend must be tallied
-- separately because the commercial models differ. Every player, draw
-- and payout therefore carries the instance it belongs to:
--   legends   = Morabaraba: Legends of the Kraal (Telkom / VS Gaming)
--   kraalboss = Morabaraba: Kraal Boss (MTN)
--
-- Players are tagged at profile creation from the build's VITE_BRAND.
-- Draws run per brand (own pools, own winners); payouts inherit the
-- brand; admin_airtime_summary() gives the per-operator tally.
-- Prize values may differ per brand: app_config key
-- 'prize_values_<brand>' overrides 'prize_values' when present.
-- Requires 0004.
-- =====================================================================

alter table profiles add column if not exists brand text not null default 'legends'
  check (brand in ('legends','kraalboss'));
create index if not exists idx_profiles_brand on profiles(brand);

alter table draws add column if not exists brand text not null default 'legends'
  check (brand in ('legends','kraalboss'));
alter table draws drop constraint if exists draws_kind_period_key_key;
alter table draws drop constraint if exists draws_brand_kind_period_key;
alter table draws add constraint draws_brand_kind_period_key unique (brand, kind, period_key);

alter table payouts add column if not exists brand text not null default 'legends'
  check (brand in ('legends','kraalboss'));
create index if not exists idx_payouts_brand_status on payouts(brand, status);

-- Entries per player for one pool period, optionally restricted to a brand.
drop function if exists entries_for_period(text, text);
create or replace function entries_for_period(p_kind text, p_period text, p_brand text default null)
returns table (profile_id uuid, entries bigint)
language sql
security definer
set search_path = public
stable
as $$
  select a.profile_id, sum(a.entries)::bigint
  from entry_accrual_daily a
  join profiles p on p.id = a.profile_id
  where period_key_for(p_kind, a.za_day) = p_period
    and (p_brand is null or p.brand = p_brand)
  group by a.profile_id
  having sum(a.entries) > 0;
$$;

-- The signed-in player's live entries — within their own brand's pools.
create or replace function my_draw_entries()
returns table (daily bigint, weekly bigint, grand bigint)
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select (now() at time zone 'Africa/Johannesburg')::date as d,
           (select brand from profiles where id = auth.uid()) as b
  )
  select
    coalesce((select e.entries from me
      cross join lateral entries_for_period('daily',  period_key_for('daily',  me.d), me.b) e
      where e.profile_id = auth.uid()), 0),
    coalesce((select e.entries from me
      cross join lateral entries_for_period('weekly', period_key_for('weekly', me.d), me.b) e
      where e.profile_id = auth.uid()), 0),
    coalesce((select e.entries from me
      cross join lateral entries_for_period('grand',  period_key_for('grand',  me.d), me.b) e
      where e.profile_id = auth.uid()), 0);
$$;
grant execute on function my_draw_entries() to authenticated;

-- Draw execution per brand.
drop function if exists execute_draw(text, text);
create or replace function execute_draw(p_kind text, p_period text, p_brand text default 'legends')
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
  v_prize_key text;
  r record;
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_kind not in ('daily','weekly','grand') then
    raise exception 'Invalid draw kind';
  end if;
  if p_brand not in ('legends','kraalboss') then
    raise exception 'Invalid brand';
  end if;
  if exists (select 1 from draws where brand = p_brand and kind = p_kind and period_key = p_period) then
    raise exception 'Draw already executed for % % %', p_brand, p_kind, p_period;
  end if;
  if p_period = period_key_for(p_kind, (now() at time zone 'Africa/Johannesburg')::date) then
    raise exception 'Period % is still open — draw it after it closes', p_period;
  end if;

  select coalesce(sum(entries), 0), count(*)
  into v_total, v_participants
  from entries_for_period(p_kind, p_period, p_brand);

  -- Brand-specific prize values if configured, else the shared ones.
  v_prize_key := case when exists (select 1 from app_config where key = 'prize_values_' || p_brand)
                      then 'prize_values_' || p_brand else 'prize_values' end;
  v_prize := coalesce(
    (select (value ->> p_kind)::int from app_config where key = v_prize_key), 0);

  v_seed := gen_random_uuid()::text;

  if v_total = 0 then
    insert into draws (brand, kind, period_key, prize_rand, status, seed,
                       total_entries, total_participants, drawn_by)
    values (p_brand, p_kind, p_period, v_prize, 'void', v_seed, 0, 0, auth.uid())
    returning id into v_draw_id;

    insert into audit_log (admin_id, action, target, detail)
    values (auth.uid(), 'draw_void', p_brand || ' ' || p_kind || ' ' || p_period,
            jsonb_build_object('reason', 'no entries', 'brand', p_brand));
    return jsonb_build_object('status', 'void', 'draw_id', v_draw_id, 'brand', p_brand);
  end if;

  v_target := ('x' || substr(md5(v_seed || p_brand || p_kind || p_period), 1, 12))::bit(48)::bigint % v_total;

  for r in
    select profile_id, entries
    from entries_for_period(p_kind, p_period, p_brand)
    order by profile_id
  loop
    v_cum := v_cum + r.entries;
    if v_target < v_cum then
      v_winner := r.profile_id;
      v_winner_entries := r.entries;
      exit;
    end if;
  end loop;

  insert into draws (brand, kind, period_key, prize_rand, seed, total_entries,
                     total_participants, winner_profile_id, winner_entries, drawn_by)
  values (p_brand, p_kind, p_period, v_prize, v_seed, v_total, v_participants,
          v_winner, v_winner_entries, auth.uid())
  returning id into v_draw_id;

  insert into payouts (draw_id, profile_id, amount_rand, brand)
  values (v_draw_id, v_winner, v_prize, p_brand);

  select username into v_username from profiles where id = v_winner;

  insert into audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'draw_executed', p_brand || ' ' || p_kind || ' ' || p_period,
          jsonb_build_object('brand', p_brand, 'winner', v_username, 'winner_id', v_winner,
                             'prize_rand', v_prize, 'seed', v_seed,
                             'total_entries', v_total, 'participants', v_participants));

  return jsonb_build_object(
    'status', 'drawn', 'brand', p_brand, 'draw_id', v_draw_id, 'winner_username', v_username,
    'winner_entries', v_winner_entries, 'total_entries', v_total,
    'participants', v_participants, 'prize_rand', v_prize, 'seed', v_seed);
end;
$$;
revoke all on function execute_draw(text, text, text) from public;
grant execute on function execute_draw(text, text, text) to authenticated;

-- Pool stats per brand for the admin UI.
drop function if exists admin_pool_stats(text, text);
create or replace function admin_pool_stats(p_kind text, p_period text, p_brand text default null)
returns table (total_entries bigint, participants int)
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(entries), 0), count(*)::int
  from entries_for_period(p_kind, p_period, p_brand)
  where is_admin();
$$;
grant execute on function admin_pool_stats(text, text, text) to authenticated;

-- Airtime spend tally per operator: by brand, status and month (SAST).
create or replace function admin_airtime_summary()
returns table (brand text, status text, month text, payouts int, rand bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.brand, p.status,
         to_char(coalesce(p.updated_at, p.created_at) at time zone 'Africa/Johannesburg', 'YYYY-MM') as month,
         count(*)::int, sum(p.amount_rand)::bigint
  from payouts p
  where is_admin()
  group by p.brand, p.status, 3
  order by 3 desc, p.brand, p.status;
$$;
grant execute on function admin_airtime_summary() to authenticated;

-- Per-brand player counts for the dashboard.
create or replace function admin_brand_counts()
returns table (brand text, players int, subscribers_active int)
language sql
security definer
set search_path = public
stable
as $$
  select b.brand,
         (select count(*)::int from profiles pr where pr.brand = b.brand),
         (select count(*)::int from wbi_subscribers s join profiles pr on pr.id = s.profile_id
           where pr.brand = b.brand and s.status = 'active')
  from (values ('legends'), ('kraalboss')) as b(brand)
  where is_admin();
$$;
grant execute on function admin_brand_counts() to authenticated;
