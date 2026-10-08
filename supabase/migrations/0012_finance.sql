-- Plano Financeiro v1. Valores em centavos (inteiros), na moeda preferida do perfil.
-- Sem tabelas filhas: todas as políticas são "all own".

create table public.finance_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income', 'expense')),
  name text not null check (length(btrim(name)) > 0 and length(name) <= 80),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000000),
  created_at timestamptz not null default now()
);
create index finance_items_user_idx on public.finance_items(user_id, kind, created_at);

create table public.finance_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0 and length(name) <= 80),
  balance_cents bigint not null check (balance_cents >= 0 and balance_cents <= 100000000000),
  monthly_payment_cents bigint not null default 0
    check (monthly_payment_cents >= 0 and monthly_payment_cents <= 100000000000),
  created_at timestamptz not null default now()
);
create index finance_debts_user_idx on public.finance_debts(user_id, created_at);

create table public.finance_reserve (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_cents bigint not null default 0
    check (balance_cents >= 0 and balance_cents <= 100000000000),
  target_months int not null default 6 check (target_months between 1 and 24),
  updated_at timestamptz not null default now()
);

create table public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0 and length(name) <= 80),
  target_cents bigint not null check (target_cents > 0 and target_cents <= 100000000000),
  saved_cents bigint not null default 0
    check (saved_cents >= 0 and saved_cents <= 100000000000),
  target_date date,
  created_at timestamptz not null default now()
);
create index finance_goals_user_idx on public.finance_goals(user_id, created_at);

alter table public.finance_items enable row level security;
alter table public.finance_debts enable row level security;
alter table public.finance_reserve enable row level security;
alter table public.finance_goals enable row level security;

create policy "finance_items_all_own" on public.finance_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_debts_all_own" on public.finance_debts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_reserve_all_own" on public.finance_reserve for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_goals_all_own" on public.finance_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
