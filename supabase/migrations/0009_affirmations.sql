create table public.affirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  for_date date not null,
  position smallint not null check (position between 1 and 5),
  text text not null check (length(btrim(text)) > 0),
  created_at timestamptz not null default now(),
  -- Garante no máximo um lote por usuário/dia, mesmo com requisições concorrentes.
  unique (user_id, for_date, position)
);

create index affirmations_user_date_idx on public.affirmations(user_id, for_date desc);

alter table public.affirmations enable row level security;

create policy "affirmations_all_own" on public.affirmations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
