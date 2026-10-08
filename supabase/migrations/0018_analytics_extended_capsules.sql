-- Analytics com consentimento + cápsulas de retenção estendida (plano Premium).

-- Consentimento explícito e revogável; padrão: desligado.
alter table public.profiles
  add column analytics_opt_in boolean not null default false;

-- Eventos pseudonimizados (hash do usuário, sem texto livre). Sem policies:
-- só a service role grava e só funções de admin leem agregados.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  event text not null check (length(event) between 1 and 60),
  user_hash text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_event_idx on public.analytics_events(event, created_at desc);
alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;

create function public.analytics_summary(days int)
returns table (event text, total bigint, users bigint)
language sql stable security definer set search_path = public as $$
  select e.event, count(*)::bigint, count(distinct e.user_hash)::bigint
  from public.analytics_events e
  where public.is_admin() and e.created_at >= now() - make_interval(days => days)
  group by e.event
  order by 2 desc;
$$;

create function public.analytics_active_users(days int)
returns bigint
language sql stable security definer set search_path = public as $$
  select count(distinct e.user_hash)::bigint
  from public.analytics_events e
  where public.is_admin() and e.created_at >= now() - make_interval(days => days);
$$;

revoke execute on function public.analytics_summary(int), public.analytics_active_users(int) from public, anon;
grant execute on function public.analytics_summary(int), public.analytics_active_users(int) to authenticated;

-- Cápsulas: 'extended' (até ~5 anos) só para assinantes ativos.
drop policy "time_capsules_insert_own" on public.time_capsules;
create policy "time_capsules_insert_own" on public.time_capsules for insert
  with check (
    auth.uid() = user_id
    and claimed_at is null
    and delivered_at is null
    and delivery_attempts = 0
    and delivery_error is null
    and deliver_on >= current_date
    and (
      (retention_tier = 'free' and deliver_on <= current_date + 366)
      or (retention_tier = 'extended' and public.has_premium() and deliver_on <= current_date + 1830)
    )
  );
