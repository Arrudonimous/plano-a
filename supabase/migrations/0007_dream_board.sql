create table public.dream_board_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('image', 'text')),
  content text not null default '',
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dream_board_items_kind_fields check (
    (kind = 'image' and image_path is not null)
    or (kind = 'text' and image_path is null and length(btrim(content)) > 0)
  )
);

create index dream_board_items_user_idx
  on public.dream_board_items(user_id, created_at desc);

create table public.dream_board_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.dream_board_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index dream_board_comments_item_idx
  on public.dream_board_comments(item_id, created_at);

alter table public.dream_board_items enable row level security;
alter table public.dream_board_comments enable row level security;

create policy "dream_board_items_all_own" on public.dream_board_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- O comentário precisa ser do usuário E pertencer a um item dele (a FK sozinha
-- não impede comentar no item de outra pessoa, pois FKs ignoram RLS).
create policy "dream_board_comments_all_own" on public.dream_board_comments for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dream_board_items i
      where i.id = item_id and i.user_id = auth.uid()
    )
  );

-- Bucket privado: cada usuário só acessa a pasta <user_id>/ dentro dele.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dream-board',
  'dream-board',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "dream_board_objects_select_own" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'dream-board'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "dream_board_objects_insert_own" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'dream-board'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "dream_board_objects_delete_own" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'dream-board'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
