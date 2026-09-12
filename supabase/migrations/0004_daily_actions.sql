create table public.daily_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date not null default current_date,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index daily_actions_user_date_idx on public.daily_actions(user_id, due_date);
