-- Selagem real da Cápsula do Tempo: o texto deixa de ser legível pelo dono via
-- API (anon key). Só a service role (job de entrega e a página, no servidor,
-- depois de entregue) lê "message". Colunas de metadados continuam legíveis.
revoke select on public.time_capsules from anon, authenticated;
grant select (
  id, user_id, deliver_on, retention_tier, claimed_at, delivered_at,
  delivery_attempts, delivery_error, created_at
) on public.time_capsules to authenticated;
