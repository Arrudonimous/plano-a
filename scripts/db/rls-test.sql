-- Testes de RLS/privilégios. Roda dentro de uma transação que é desfeita no fim.
-- Uso: psql -v ON_ERROR_STOP=1 -X -d plano_a_test -f scripts/db/rls-test.sql
begin;
create schema t;
grant usage on schema t to public;

create function t.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function t.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'service_role', true);
end $$;
create function t.as_super() returns void language plpgsql as $$
begin perform set_config('role', 'none', true); end $$;
create function t.count(q text) returns int language plpgsql as $$
declare n int; begin execute 'select count(*) from (' || q || ') s' into n; return n; end $$;
create function t.fails(q text) returns boolean language plpgsql as $$
begin execute q; return false; exception when others then return true; end $$;
create function t.check(ok boolean, msg text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@x.com'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@x.com'),
  ('cccccccc-0000-0000-0000-000000000003', 'admin@x.com');
-- profiles são criadas por trigger em auth.users (0001); garante se não houver.
insert into public.profiles (id) select id from auth.users on conflict do nothing;
insert into public.admins values ('cccccccc-0000-0000-0000-000000000003');

-- ===== isolamento básico =====
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.dreams (user_id, description) values ('aaaaaaaa-0000-0000-0000-000000000001', 'sonho de A');
select t.check(t.count('select 1 from public.dreams') = 1, 'A vê o próprio sonho');
select t.check(t.fails($q$insert into public.dreams (user_id, description) values ('bbbbbbbb-0000-0000-0000-000000000002', 'x')$q$), 'A não insere sonho em nome de B');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.check(t.count('select 1 from public.dreams') = 0, 'B não vê o sonho de A');

-- ===== projetos: filhos não apontam para pai alheio =====
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.projects (id, user_id, title) values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Projeto A');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.check(t.fails($q$insert into public.project_steps (project_id, user_id, title) values ('11111111-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'invasor')$q$), 'B não cria passo em projeto de A');

-- ===== finanças =====
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.finance_items (user_id, kind, name, amount_cents) values ('aaaaaaaa-0000-0000-0000-000000000001', 'income', 'salário', 500000);
select t.check(t.fails($q$insert into public.finance_items (user_id, kind, name, amount_cents) values ('aaaaaaaa-0000-0000-0000-000000000001', 'income', 'x', -5)$q$), 'valor negativo é recusado');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.check(t.count('select 1 from public.finance_items') = 0, 'B não vê finanças de A');

-- ===== cápsula selada =====
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.time_capsules (user_id, message, deliver_on) values ('aaaaaaaa-0000-0000-0000-000000000001', 'segredo', current_date + 10);
select t.check(t.count('select id, deliver_on from public.time_capsules') = 1, 'A vê metadados da cápsula');
select t.check(t.fails('select message from public.time_capsules'), 'A NÃO lê o texto da cápsula');
select t.check(t.fails('select * from public.time_capsules'), 'select * na cápsula é recusado');
update public.time_capsules set delivered_at = now();
select t.as_service();
select t.check(t.count('select 1 from public.time_capsules where delivered_at is not null') = 0, 'A não consegue marcar a cápsula como entregue');
select t.check(t.count('select message from public.time_capsules') = 1, 'service role lê o texto');

-- ===== conteúdo / premium =====
select t.as_super();
insert into public.programs (id, slug, kind, title, access, published) values
  ('22222222-0000-0000-0000-000000000001', 'prem', 'program', '{"pt-BR":"Premium"}', 'premium', true),
  ('22222222-0000-0000-0000-000000000002', 'rascunho', 'program', '{"pt-BR":"Rascunho"}', 'free', false);
insert into public.program_lessons (id, program_id, position, title) values
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 0, '{"pt-BR":"Aula premium"}'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 0, '{"pt-BR":"Aula rascunho"}');
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select t.check(t.count($q$select 1 from public.programs where slug = 'prem'$q$) = 1, 'programa premium aparece na vitrine');
select t.check(t.count($q$select 1 from public.programs where slug = 'rascunho'$q$) = 0, 'rascunho não aparece para usuário');
select t.check(t.count($q$select 1 from public.program_lessons where id = '33333333-0000-0000-0000-000000000001'$q$) = 0, 'aula premium bloqueada sem assinatura');
select t.check(t.count($q$select 1 from public.program_lessons where program_id in (select id from public.programs where slug = 'clt-para-negocio')$q$) = 8, 'jornada gratuita: 8 aulas visíveis');
select t.check(t.fails($q$insert into public.programs (slug, kind, title) values ('hack', 'program', '{}')$q$), 'usuário comum não cria programa');
select t.check(t.fails($q$insert into public.admins values ('aaaaaaaa-0000-0000-0000-000000000001')$q$), 'usuário não se torna admin');
select t.check(t.fails($q$insert into public.subscriptions (user_id, status) values ('aaaaaaaa-0000-0000-0000-000000000001', 'active')$q$), 'usuário não se dá assinatura');
select t.check(t.fails($q$insert into public.lesson_progress (user_id, lesson_id) values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001')$q$), 'não marca progresso em aula bloqueada');

select t.as_super();
insert into public.subscriptions (user_id, status, current_period_end) values ('aaaaaaaa-0000-0000-0000-000000000001', 'active', now() + interval '10 days');
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select t.check(t.count($q$select 1 from public.program_lessons where id = '33333333-0000-0000-0000-000000000001'$q$) = 1, 'assinante vê aula premium');
insert into public.lesson_progress (user_id, lesson_id) values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001');
select t.as_super();
update public.subscriptions set current_period_end = now() - interval '1 day';
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select t.check(t.count($q$select 1 from public.program_lessons where id = '33333333-0000-0000-0000-000000000001'$q$) = 0, 'assinatura vencida perde acesso');

-- matrícula não aponta para projeto alheio
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.check(t.fails($q$insert into public.program_enrollments (user_id, program_id, project_id) values ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001')$q$), 'matrícula não usa projeto de outra pessoa');

-- admin
select t.as_user('cccccccc-0000-0000-0000-000000000003');
select t.check(t.count($q$select 1 from public.programs where slug = 'rascunho'$q$) = 1, 'admin vê rascunhos');
select t.check(t.count($q$select 1 from public.program_lessons where id = '33333333-0000-0000-0000-000000000001'$q$) = 1, 'admin vê aulas premium');
insert into public.programs (slug, kind, title) values ('novo', 'program', '{"pt-BR":"Novo"}');
select t.check(true, 'admin cria programa');

-- ===== espaço =====
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
insert into public.spirit_entries (user_id, entry_date, kind, text) values ('aaaaaaaa-0000-0000-0000-000000000001', current_date, 'reflection', 'privado');
select t.check(t.fails($q$insert into public.spirit_entries (user_id, entry_date, kind, text) values ('aaaaaaaa-0000-0000-0000-000000000001', current_date, 'outro', 'x')$q$), 'tipo inválido de registro é recusado');
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.check(t.count('select 1 from public.spirit_entries') = 0, 'B não vê o espaço de A');

select t.as_super();
rollback;
\echo 'RLS: tudo certo.'
