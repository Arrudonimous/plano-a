create table public.gratitude_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  text text not null check (length(btrim(text)) > 0 and length(text) <= 500),
  created_at timestamptz not null default now()
);

create index gratitude_entries_user_date_idx
  on public.gratitude_entries(user_id, entry_date desc, created_at desc);

alter table public.gratitude_entries enable row level security;

create policy "gratitude_entries_all_own" on public.gratitude_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
