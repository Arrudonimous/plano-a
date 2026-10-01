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

- [ ] Mural dos Sonhos / Vision Board (moodboard visual: adicionar imagens e textos, comentários, editar/excluir itens; upload via Supabase Storage, export/compartilhamento)
- [ ] Cápsula do Tempo (a pessoa escreve o que quer conquistar, escolhe um prazo, e o app envia por e-mail nessa data via Resend; mensagens seladas para o futuro, abertura agendada; design deve contemplar desde já a cobrança por período de retenção estendida — feature paga, ainda que a implementação de billing venha depois)
- [ ] Gratidão (registro de gratidão)

## Backlog — Minha Ação (grupo, estendido)

- [ ] Planejamento / Projetos (múltiplas etapas, distinto de tarefas simples)
- [ ] Plano Financeiro (receitas, despesas, dívidas, reserva, metas)
- [ ] CLT → Negócio (jornada de transição de carreira)

## Backlog — Minha Evolução (grupo)

- [ ] Afirmações (IA via API da Anthropic/Claude gera afirmações novas todo dia) / Mentalizações (vídeos guiados) / Programas (conteúdo guiado)
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
- Gaps de infra que Mural dos Sonhos, Cápsula do Tempo e Afirmações vão exigir do zero: Supabase Storage (bucket + policies, hoje inexistente) e um mecanismo de cron/agendamento (necessário tanto para Cápsula do Tempo quanto para Afirmações — vale decidir uma solução única e reutilizável para as duas).
- Preocupação de posicionamento de produto: hoje o app está parecendo mais um app de planejamento do que algo que guia a pessoa a se desenvolver. Não está claro se completar o restante do backlog (mural, cápsula, afirmações, mentalização) resolve isso — tratar como questão de posicionamento de produto, não só de features faltando.
