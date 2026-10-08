-- Plano Financeiro v2: várias moedas (com cotação diária), lançamentos por data,
-- juros nas dívidas e meta ligada a um sonho.

alter table public.finance_items
  add column currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$');
alter table public.finance_debts
  add column currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  add column monthly_rate_pct numeric(6, 3) not null default 0
    check (monthly_rate_pct >= 0 and monthly_rate_pct <= 100);
alter table public.finance_goals
  add column currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  add column dream_id uuid references public.dreams(id) on delete set null;

-- O sonho ligado precisa ser do próprio usuário (FKs ignoram RLS).
drop policy "finance_goals_all_own" on public.finance_goals;
create policy "finance_goals_all_own" on public.finance_goals for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      dream_id is null
      or exists (
        select 1 from public.dreams d
        where d.id = dream_id and d.user_id = auth.uid()
      )
    )
  );

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null,
  kind text not null check (kind in ('income', 'expense')),
  category text not null check (category in (
    'housing', 'food', 'transport', 'health', 'education', 'leisure', 'family',
    'debts', 'other', 'salary', 'freelance', 'investments'
  )),
  description text not null default '' check (length(description) <= 120),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000000),
  currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now()
);
create index finance_transactions_user_idx on public.finance_transactions(user_id, occurred_on desc);
alter table public.finance_transactions enable row level security;
create policy "finance_transactions_all_own" on public.finance_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cotações: unidades da moeda por 1 USD. Escrita só pelo job (service role).
create table public.exchange_rates (
  currency text primary key check (currency ~ '^[A-Z]{3}$'),
  per_usd numeric not null check (per_usd > 0),
  fetched_at timestamptz not null default now()
);
alter table public.exchange_rates enable row level security;
create policy "exchange_rates_select" on public.exchange_rates for select
  to authenticated using (true);
