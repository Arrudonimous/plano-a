# Plano A — Roadmap

## Status: Núcleo Essencial (v1) — concluído

- [x] Scaffold Next.js (App Router) + PWA (Serwist) + i18n (next-intl) + Supabase
- [x] Autenticação (cadastro/login/logout) via Supabase Auth
- [x] Meu Dia
- [x] Lista dos Sonhos
- [x] Meus Objetivos (6 meses / 1 ano / 5 anos / 10 anos)
- [x] Minha Ação — Hoje + Hábitos
- [x] Aplicar as migrations em um projeto Supabase real e configurar `.env.local`
- [x] Gerar `src/lib/types/database.types.ts` a partir do projeto real (`supabase gen types typescript`)
- [x] Identidade visual final: acento âmbar sobre base creme/marinho, logo, ícones SVG na navegação e nova Página Inicial (hero, progresso do dia, atalhos). Ajustável via tokens em `globals.css`
- [x] Ícones finais do PWA (gerados por `node scripts/generate-icons.mjs` a partir da marca)
- [x] Corrigir tradução (i18n): mensagens de erro de login/cadastro traduzidas e seletor de idioma funcional adicionado em Configurações
- [x] Meus Objetivos: onboarding via placeholders de exemplo por período + feedback de "Salvo"

## Backlog — Minha Visão (grupo)

- [x] Mural dos Sonhos / Vision Board: aba "Mural" em Sonhos com imagens (upload direto ao Supabase Storage, redimensionadas no navegador) e textos, comentários e editar/excluir. Pendente: export/compartilhamento (ver Share Cards) e aplicar a migration `0007_dream_board.sql` no projeto Supabase real
- [x] Cápsula do Tempo: aba "Cápsula" em Sonhos (mensagem + data de envio, até 1 ano), e-mail via Resend por job diário (`/api/cron/deliver-capsules`, idempotente, com retentativas). O design já prevê a retenção estendida paga (`retention_tier = 'extended'`, hoje bloqueada por RLS); a cobrança em si depende do item "Pagamentos e assinaturas". Pendente para entrar no ar: aplicar `0008_time_capsules.sql`, configurar Resend/`CRON_SECRET` (ver README). Observação: o conteúdo de cápsulas pendentes fica oculto na interface, mas o próprio dono ainda consegue lê-lo via API
- [ ] Gratidão (registro de gratidão)

## Backlog — Minha Ação (grupo, estendido)

- [ ] Planejamento / Projetos (múltiplas etapas, distinto de tarefas simples)
- [ ] Plano Financeiro (receitas, despesas, dívidas, reserva, metas)
- [ ] CLT → Negócio (jornada de transição de carreira)

## Backlog — Minha Evolução (grupo)

- [x] Afirmações: página `/afirmacoes` com 3 afirmações novas por dia geradas pela API do Claude (personalizadas por sonhos/objetivos, sem repetir as recentes), com histórico e cartão "Afirmação do dia" em Meu Dia. Pendente para entrar no ar: aplicar `0009_affirmations.sql` e definir `ANTHROPIC_API_KEY`
- [ ] Mentalizações (vídeos guiados) / Programas (conteúdo guiado)
- [ ] Espiritualidade (Meu Espaço de Fé)
- [ ] Progresso / Conquistas (mapa, badges — manter tom não-punitivo)

## Backlog — Plataforma / Infra

- [ ] Pagamentos e assinaturas (planos, cobrança)
- [ ] Painel Admin / CMS (Academia, programas, conteúdo)
- [ ] Analytics de produto (retenção, uso — respeitando privacidade)
- [ ] Expansão i18n: tradução completa en/es (revisão humana, seletor pt-BR/en já implementado em Configurações), conversão de moeda
- [ ] Hardening de proteção de conteúdo (screenshot protection, watermark em share cards, rate limiting, anti-scraping)
- [ ] Share Cards (geração de imagem compartilhável para conquistas/sonhos/streaks)
- [ ] Academia / CMS (cursos, conteúdo guiado)

## Notas

- Cada item acima deve virar uma issue própria quando entrar em planejamento; ao iniciar o trabalho, mover para "Em progresso" nesta seção e linkar o PR.
- O grafo do `graphify` deste projeto deve ser gerado/atualizado com `plano-a/` como working root — nunca a partir da raiz `Freelancer/`.
- Supabase Storage agora existe (bucket privado `dream-board`, policies por pasta `<user_id>/` na migration 0007) e pode ser reutilizado. Cron/agendamento agora existe (rota protegida por `CRON_SECRET` + `vercel.json`) e e-mail transacional via Resend (`src/lib/email/resend.ts`); ambos são reutilizáveis para as Afirmações.
- Preocupação de posicionamento de produto: hoje o app está parecendo mais um app de planejamento do que algo que guia a pessoa a se desenvolver. Não está claro se completar o restante do backlog (mural, cápsula, afirmações, mentalização) resolve isso — tratar como questão de posicionamento de produto, não só de features faltando.
