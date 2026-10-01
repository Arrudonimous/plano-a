create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (length(btrim(message)) > 0),
  deliver_on date not null,
  -- 'free' = prazo de até 1 ano. 'extended' é reservado para o plano pago de
  -- retenção estendida (ainda não existe cobrança): hoje o usuário não consegue
  -- criar cápsulas 'extended' (ver policy de insert).
  retention_tier text not null default 'free' check (retention_tier in ('free', 'extended')),
  claimed_at timestamptz,
  delivered_at timestamptz,
  delivery_attempts int not null default 0,
  delivery_error text,
  created_at timestamptz not null default now()
);

create index time_capsules_user_idx on public.time_capsules(user_id, deliver_on);
create index time_capsules_pending_idx on public.time_capsules(deliver_on)
  where delivered_at is null;

alter table public.time_capsules enable row level security;

create policy "time_capsules_select_own" on public.time_capsules for select
  using (auth.uid() = user_id);

-- Os campos de entrega (claimed_at, delivered_at, ...) só são escritos pelo job
-- com a service role. O usuário só cria cápsulas "limpas" e dentro do prazo
-- gratuito. O app valida o prazo exato no fuso do usuário (amanhã até +365
-- dias); aqui as margens são folgadas porque current_date é UTC.
create policy "time_capsules_insert_own" on public.time_capsules for insert
  with check (
    auth.uid() = user_id
    and retention_tier = 'free'
    and claimed_at is null
    and delivered_at is null
    and delivery_attempts = 0
    and delivery_error is null
    and deliver_on >= current_date
    and deliver_on <= current_date + 366
  );

create policy "time_capsules_delete_own" on public.time_capsules for delete
  using (auth.uid() = user_id);
