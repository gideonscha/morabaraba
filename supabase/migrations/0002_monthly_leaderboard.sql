-- =====================================================================
-- 0002: Monthly leaderboard + permanent player achievements
--
-- Client spec (Jul 2026):
--  * One leaderboard, ranked by points earned in the current calendar
--    month. Points = coins earned (client kept coins as the single
--    currency; win 3 / draw 1 / loss 0).
--  * Resets 00:00 on the 1st (derived: the view only counts the current
--    month's transactions, so no reset job is needed for ranking).
--  * Permanent stats that never reset: lifetime points, best monthly
--    score, highest leaderboard rank.
-- =====================================================================

alter table profiles add column if not exists lifetime_points int not null default 0;
alter table profiles add column if not exists best_monthly_score int not null default 0;
alter table profiles add column if not exists highest_rank int;

-- Monthly points come from the coin ledger: positive transactions in
-- the current calendar month (server time = UTC; SAST offset handled
-- at draw finalisation, not ranking).
create or replace view monthly_leaderboard as
select
  p.id,
  p.username,
  p.avatar_id,
  p.tier,
  p.region,
  coalesce(sum(ct.amount) filter (
    where ct.amount > 0
      and ct.created_at >= date_trunc('month', now())
  ), 0)::int as monthly_points,
  rank() over (
    order by coalesce(sum(ct.amount) filter (
      where ct.amount > 0
        and ct.created_at >= date_trunc('month', now())
    ), 0) desc
  )::int as rank
from profiles p
left join coin_transactions ct on ct.profile_id = p.id
group by p.id;

-- A player's own rank + points, even when outside the top 50.
create or replace function my_monthly_rank()
returns table (monthly_points int, rank int)
language sql
security definer
set search_path = public
stable
as $$
  select ml.monthly_points, ml.rank
  from monthly_leaderboard ml
  where ml.id = auth.uid();
$$;

revoke all on function my_monthly_rank() from public;
grant execute on function my_monthly_rank() to authenticated;

-- Extend award_coins with the new earn reasons and keep lifetime_points
-- in sync on every award.
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
    'draw_match','herd_care','daily_login','streak_bonus','promotional',
    'refund','adjustment','prize','performance_reward'
  ) then
    raise exception 'Invalid reason: %', p_reason;
  end if;

  update profiles
  set coins = coins + p_amount,
      lifetime_points = lifetime_points + p_amount
  where id = p_profile_id
  returning coins into new_balance;

  insert into coin_transactions (profile_id, amount, reason, reference_id, balance_after, metadata)
  values (p_profile_id, p_amount, p_reason, p_reference_id, new_balance, p_metadata);

  return new_balance;
end;
$$;

-- Month-end finalisation: snapshots best monthly score and highest rank
-- for every player who scored, for the month just ended. Idempotent.
-- Run on the 1st of each month (scheduler wiring is a deploy concern:
-- pg_cron or an external cron hitting an edge function).
create or replace function finalize_month(p_month date default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_count int;
begin
  -- Default: the month before the current one.
  v_start := date_trunc('month', coalesce(p_month, (date_trunc('month', now()) - interval '1 day')::date));
  v_end   := v_start + interval '1 month';

  with month_scores as (
    select
      ct.profile_id,
      sum(ct.amount) filter (where ct.amount > 0)::int as pts
    from coin_transactions ct
    where ct.created_at >= v_start and ct.created_at < v_end
    group by ct.profile_id
    having sum(ct.amount) filter (where ct.amount > 0) > 0
  ),
  ranked as (
    select profile_id, pts, rank() over (order by pts desc)::int as rnk
    from month_scores
  )
  update profiles p
  set best_monthly_score = greatest(p.best_monthly_score, r.pts),
      highest_rank = least(coalesce(p.highest_rank, r.rnk), r.rnk)
  from ranked r
  where p.id = r.profile_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function finalize_month(date) from public;
-- service_role only — never callable from clients.
