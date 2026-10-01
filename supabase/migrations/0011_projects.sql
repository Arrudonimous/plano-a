create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0 and length(title) <= 120),
  description text not null default '' check (length(description) <= 1000),
  dream_id uuid references public.dreams(id) on delete set null,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_idx on public.projects(user_id, created_at desc);

create table public.project_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0 and length(title) <= 200),
  position int not null default 0,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index project_steps_project_idx on public.project_steps(project_id, position);
create index project_steps_user_idx on public.project_steps(user_id);

alter table public.projects enable row level security;
alter table public.project_steps enable row level security;

-- O sonho ligado precisa ser do próprio usuário (FKs ignoram RLS).
create policy "projects_all_own" on public.projects for all
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

-- O passo precisa ser do usuário E pertencer a um projeto dele.
create policy "project_steps_all_own" on public.project_steps for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
