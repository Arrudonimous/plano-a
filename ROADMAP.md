# Plano A — Roadmap

## Status: Núcleo Essencial (v1)

- [x] Scaffold Next.js (App Router) + PWA (Serwist) + i18n (next-intl) + Supabase
- [x] Autenticação (cadastro/login/logout) via Supabase Auth
- [x] Meu Dia
- [x] Lista dos Sonhos
- [x] Meus Objetivos (6 meses / 1 ano / 5 anos / 10 anos)
- [x] Minha Ação — Hoje + Hábitos
- [x] Aplicar as migrations em um projeto Supabase real e configurar `.env.local`
- [x] Gerar `src/lib/types/database.types.ts` a partir do projeto real (`supabase gen types typescript`)
- [ ] Identidade visual final (a paleta atual é um placeholder premium neutro) — inclui repensar a Página Inicial, hoje visualmente fraca (direção ainda não decidida)
- [ ] Ícones finais do PWA (os atuais em `public/icons/` são placeholders gerados por script)
- [ ] Corrigir tradução (i18n): next-intl está configurado, mas a tradução não está sendo aplicada em todo lugar
- [ ] Meus Objetivos: adicionar onboarding/placeholder de ajuda (a seção não sugere como preencher as metas)

## Backlog — Minha Visão (grupo)

- [ ] Mural dos Sonhos / Vision Board (moodboard visual: adicionar imagens e textos, comentários, editar/excluir itens; upload via Supabase Storage, export/compartilhamento)
- [ ] Cápsula do Tempo (a pessoa escreve o que quer conquistar, escolhe um prazo, e o app envia por e-mail nessa data; mensagens seladas para o futuro, abertura agendada; cogitado cobrar valor extra por período de retenção — feature paga)
- [ ] Gratidão (registro de gratidão)

## Backlog — Minha Ação (grupo, estendido)

- [ ] Planejamento / Projetos (múltiplas etapas, distinto de tarefas simples)
- [ ] Plano Financeiro (receitas, despesas, dívidas, reserva, metas)
- [ ] CLT → Negócio (jornada de transição de carreira)

## Backlog — Minha Evolução (grupo)

- [ ] Afirmações (IA gera afirmações novas todo dia) / Mentalizações (vídeos guiados) / Programas (conteúdo guiado)
- [ ] Espiritualidade (Meu Espaço de Fé)
- [ ] Progresso / Conquistas (mapa, badges — manter tom não-punitivo)

## Backlog — Plataforma / Infra

- [ ] Pagamentos e assinaturas (planos, cobrança)
- [ ] Painel Admin / CMS (Academia, programas, conteúdo)
- [ ] Analytics de produto (retenção, uso — respeitando privacidade)
- [ ] Expansão i18n: tradução completa en/es (revisão humana), seletor de idioma ativo, conversão de moeda
- [ ] Hardening de proteção de conteúdo (screenshot protection, watermark em share cards, rate limiting, anti-scraping)
- [ ] Share Cards (geração de imagem compartilhável para conquistas/sonhos/streaks)
- [ ] Academia / CMS (cursos, conteúdo guiado)

## Notas

- Cada item acima deve virar uma issue própria quando entrar em planejamento; ao iniciar o trabalho, mover para "Em progresso" nesta seção e linkar o PR.
- O grafo do `graphify` deste projeto deve ser gerado/atualizado com `plano-a/` como working root — nunca a partir da raiz `Freelancer/`.
- Preocupação de posicionamento de produto: hoje o app está parecendo mais um app de planejamento do que algo que guia a pessoa a se desenvolver. Não está claro se completar o restante do backlog (mural, cápsula, afirmações, mentalização) resolve isso — tratar como questão de posicionamento de produto, não só de features faltando.
