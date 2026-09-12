create type public.objective_period as enum ('6_MONTHS', '1_YEAR', '5_YEARS', '10_YEARS');

create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period public.objective_period not null,
  declaration text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);
