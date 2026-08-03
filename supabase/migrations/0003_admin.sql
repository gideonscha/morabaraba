-- =====================================================================
-- 0003: Admin site foundation
--  * admin_users + is_admin() helper
--  * app_config: runtime game configuration editable from the admin UI
--  * audit_log: every privileged admin action, recorded server-side
--  * admin_adjust_coins(): coin corrections through the ledger
--  * admin read policies on player data
-- =====================================================================

-- ---------------------------------------------------------------------
-- Admin identity
-- ---------------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin','viewer')),
  created_at timestamptz default now()
);

alter table admin_users enable row level security;
drop policy if exists admin_users_read_self on admin_users;
create policy admin_users_read_self on admin_users
  for select using (auth.uid() = id);

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Runtime game configuration
-- ---------------------------------------------------------------------
create table if not exists app_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid
);

alter table app_config enable row level security;
drop policy if exists app_config_read_all on app_config;
create policy app_config_read_all on app_config
  for select using (true);
drop policy if exists app_config_write_admin on app_config;
create policy app_config_write_admin on app_config
  for update using (is_admin()) with check (is_admin());

insert into app_config (key, value, description) values
  ('prize_values', '{"daily": 50, "weekly": 300, "grand": 1000}',
   'Prize draw values in Rand'),
  ('scoring', '{"win": 3, "draw": 1, "loss": 0}',
   'Coins per match result (flat across modes)'),
  ('entries', '{"coins_per_entry": 10, "daily_entry_cap": 20}',
   'Draw entry conversion rate and daily cap'),
  ('podium', '{"first": 300, "second": 200, "third": 50}',
   'Monthly leaderboard performance rewards in Rand (airtime)')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id),
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

alter table audit_log enable row level security;
drop policy if exists audit_log_read_admin on audit_log;
create policy audit_log_read_admin on audit_log
  for select using (is_admin());
-- inserts happen only inside security-definer functions / triggers

-- Config changes are audited automatically.
create or replace function log_config_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  insert into audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'config_update', new.key,
          jsonb_build_object('old', old.value, 'new', new.value));
  return new;
end;
$$;

drop trigger if exists trg_app_config_audit on app_config;
create trigger trg_app_config_audit
  before update on app_config
  for each row execute function log_config_change();

-- ---------------------------------------------------------------------
-- Admin coin adjustment — the only sanctioned way to correct balances
-- ---------------------------------------------------------------------
create or replace function admin_adjust_coins(
  p_target uuid,
  p_amount int,
  p_note text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_amount = 0 then
    raise exception 'Amount must be non-zero';
  end if;
  if coalesce(trim(p_note), '') = '' then
    raise exception 'A note explaining the adjustment is required';
  end if;

  update profiles
  set coins = greatest(0, coins + p_amount),
      lifetime_points = case when p_amount > 0
        then lifetime_points + p_amount else lifetime_points end
  where id = p_target
  returning coins into new_balance;

  if new_balance is null then
    raise exception 'Unknown profile';
  end if;

  insert into coin_transactions (profile_id, amount, reason, balance_after, metadata)
  values (p_target, p_amount, 'adjustment', new_balance,
          jsonb_build_object('note', p_note, 'admin', auth.uid()));

  insert into audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'coin_adjustment', p_target::text,
          jsonb_build_object('amount', p_amount, 'note', p_note, 'balance_after', new_balance));

  return new_balance;
end;
$$;

revoke all on function admin_adjust_coins(uuid, int, text) from public;
grant execute on function admin_adjust_coins(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------
-- Admin read access to player data
-- ---------------------------------------------------------------------
drop policy if exists coin_transactions_read_admin on coin_transactions;
create policy coin_transactions_read_admin on coin_transactions
  for select using (is_admin());

-- profiles already carries a public read policy for leaderboards; if the
-- project ever tightens that, admins keep full visibility:
drop policy if exists profiles_read_admin on profiles;
create policy profiles_read_admin on profiles
  for select using (is_admin());
