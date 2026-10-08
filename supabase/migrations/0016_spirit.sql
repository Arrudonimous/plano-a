-- "Meu Espaço": cuidado com o lado espiritual/interior, sem vínculo com religião
-- específica. A pessoa nomeia a própria prática (ou deixa em branco).
create table public.spirit_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  practice_label text not null default '' check (length(practice_label) <= 60),
  updated_at timestamptz not null default now()
);

create table public.spirit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  kind text not null check (kind in ('reflection', 'practice', 'intention', 'inspiration')),
  text text not null check (length(btrim(text)) > 0 and length(text) <= 2000),
  created_at timestamptz not null default now()
);
create index spirit_entries_user_idx on public.spirit_entries(user_id, entry_date desc);

alter table public.spirit_settings enable row level security;
alter table public.spirit_entries enable row level security;

create policy "spirit_settings_all_own" on public.spirit_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "spirit_entries_all_own" on public.spirit_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
