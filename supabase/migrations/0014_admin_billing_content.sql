-- Base de plataforma: administradores, assinatura (premium) e motor de conteúdo
-- guiado (programas, jornadas e mentalizações compartilham as mesmas tabelas).

-- ---------------------------------------------------------------- admins
-- Sem policies de escrita: administradores só entram pelo SQL editor / service role.
--   insert into public.admins select id from auth.users where email = 'voce@exemplo.com';
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins_select_own" on public.admins for select
  using (auth.uid() = user_id);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------- subscriptions
-- Escrita somente pelo webhook de pagamento (service role): sem policies de escrita.
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null default 'premium',
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);
create index subscriptions_customer_idx on public.subscriptions(provider_customer_id);
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions for select
  using (auth.uid() = user_id);

create function public.has_premium() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- --------------------------------------------------------------- content
-- Textos são jsonb por idioma: {"pt-BR": "...", "en": "...", "es": "..."}.
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  kind text not null check (kind in ('program', 'journey', 'meditation')),
  title jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  access text not null default 'free' check (access in ('free', 'premium')),
  published boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index programs_kind_idx on public.programs(kind, position) where published;

create table public.program_lessons (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  position int not null default 0,
  title jsonb not null,
  body jsonb not null default '{}'::jsonb,
  -- URL (YouTube/Vimeo/arquivo) ou "storage:<caminho>" no bucket privado "content".
  media_url text,
  duration_minutes int check (duration_minutes is null or duration_minutes between 1 and 600),
  -- Lista de passos práticos: [{"pt-BR": "...", "en": "..."}]; viram passos de projeto nas jornadas.
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index program_lessons_program_idx on public.program_lessons(program_id, position);

create table public.program_enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  started_at timestamptz not null default now(),
  primary key (user_id, program_id)
);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.program_lessons(id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.programs enable row level security;
alter table public.program_lessons enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.lesson_progress enable row level security;

create policy "programs_select" on public.programs for select
  to authenticated using (published or public.is_admin());
create policy "programs_admin_write" on public.programs for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- Aulas de conteúdo premium só para assinantes (ou admin): aplicado no banco.
create policy "program_lessons_select" on public.program_lessons for select
  to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.programs p
      where p.id = program_id and p.published
        and (p.access = 'free' or public.has_premium())
    )
  );
create policy "program_lessons_admin_write" on public.program_lessons for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- FKs ignoram RLS: o programa precisa ser visível e o projeto, do próprio usuário.
create policy "program_enrollments_all_own" on public.program_enrollments for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.programs p where p.id = program_id)
    and (
      project_id is null
      or exists (
        select 1 from public.projects pr
        where pr.id = project_id and pr.user_id = auth.uid()
      )
    )
  );

create policy "lesson_progress_all_own" on public.lesson_progress for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.program_lessons l where l.id = lesson_id)
  );

-- ---------------------------------------------------------------- storage
-- Mídia privada. Só admins enviam; leitura é por URL assinada gerada no servidor
-- (service role) depois de checar o acesso à aula.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content', 'content', false, 52428800,
  array['video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "content_objects_admin_insert" on storage.objects for insert
  to authenticated with check (bucket_id = 'content' and public.is_admin());
create policy "content_objects_admin_delete" on storage.objects for delete
  to authenticated using (bucket_id = 'content' and public.is_admin());
create policy "content_objects_admin_select" on storage.objects for select
  to authenticated using (bucket_id = 'content' and public.is_admin());
