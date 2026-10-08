# Plano A

Sonhe. Planeje. Aja. Avance.

Plataforma de desenvolvimento pessoal e planejamento de vida, instalável como PWA (Android e iPhone). Idiomas: pt-BR (padrão), en e es.

**O que tem:** Sonhos (lista, mural, cápsula do tempo), Metas, Minha Ação (hoje, hábitos, projetos), Afirmações diárias (IA), Gratidão, Meu Espaço, Plano Financeiro (várias moedas), Jornadas / Programas / Mentalizações (conteúdo guiado, com premium), Progresso e conquistas, cartões de compartilhamento, assinatura Premium (Stripe), painel de conteúdo e métricas para administradores, exportar e excluir conta (LGPD). Veja [ROADMAP.md](./ROADMAP.md).

**Para colocar no ar:** siga [docs/LAUNCH.md](./docs/LAUNCH.md) (checklist do que só o dono pode fazer).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router). Atenção: esta versão tem breaking changes (ex.: `src/proxy.ts` em vez de `middleware.ts`); leia `node_modules/next/dist/docs/` antes de escrever código Next
- [Supabase](https://supabase.com) (Postgres, Auth, RLS, Storage)
- [next-intl](https://next-intl.dev) (pt-BR sem prefixo na URL; `/en`, `/es`)
- [Serwist](https://serwist.pages.dev) (PWA; exige webpack, por isso os scripts usam `--webpack`)
- Tailwind CSS v4; Stripe e Resend via REST (sem SDK); `@anthropic-ai/sdk` para as afirmações

## Configuração

1. Crie um projeto no Supabase e aplique **todas** as migrations de `supabase/migrations/` em ordem (SQL Editor ou `supabase db push`).
2. Copie `.env.example` para `.env.local` e preencha (cada bloco está comentado). Só as 4 primeiras variáveis são obrigatórias para rodar; as demais ativam recursos:

   | Recurso | Variáveis |
   |---|---|
   | Núcleo | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` |
   | Crons (cápsulas, cotações) | `CRON_SECRET` |
   | Cápsula do Tempo | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (domínio verificado) |
   | Afirmações | `ANTHROPIC_API_KEY`, opcional `AFFIRMATIONS_MODEL` |
   | Premium | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` |
   | Analytics (opt-in) | `ANALYTICS_SALT` |
   | Páginas legais | `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL` |
   | Alerta de erros | `ERROR_WEBHOOK_URL` (opcional) |

3. Os tipos do banco (`src/lib/types/database.types.ts`) já foram gerados a partir de um banco local com todas as migrations. Depois de qualquer mudança de schema, regenere (e recoloque no fim do arquivo o alias `ObjectivePeriod`):
   ```bash
   supabase gen types typescript --linked > src/lib/types/database.types.ts
   ```
4. Primeiro administrador (painel `/admin`, só leitura de métricas e edição de conteúdo): no SQL Editor,
   ```sql
   insert into public.admins select id from auth.users where email = 'voce@exemplo.com';
   ```
5. Crons (`vercel.json`): `/api/cron/deliver-capsules` (12:00 UTC) e `/api/cron/update-rates` (06:00 UTC). Na primeira vez, rode as cotações manualmente: `curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron/update-rates`.
6. Stripe: crie o produto Premium com preços recorrentes (mensal e/ou anual), copie os IDs `price_...` e aponte o webhook para `https://SEU-DOMINIO/api/stripe/webhook` com os eventos `checkout.session.completed` e `customer.subscription.*`.

## Desenvolvimento

```bash
npm run dev          # servidor de desenvolvimento (service worker desligado)
npm run build && npm start   # build de produção (testa PWA/offline)
npm run check        # tsc + eslint + testes unitários + paridade de traduções + "use server"
npm run test:db      # migrations + RLS num Postgres local (precisa de psql e de um Postgres)
```

- **Testes unitários** (`npm test`): lógica pura em `src/**/*.test.ts` (node:test).
- **Banco** (`scripts/db`): aplica as migrations num Postgres puro com um stub do Supabase e roda `rls-test.sql` (isolamento entre usuários, cápsula selada, premium, admin, rate limit, Storage fora do escopo).
- **E2E** (`e2e/`): app compilado contra um Supabase local de verdade + navegador em viewport de celular, com stub de Resend/Stripe/Claude. Passo a passo em [e2e/README.md](./e2e/README.md).
- **CI** (`.github/workflows`): tipos, lint, testes, traduções, build e migrations/RLS a cada PR; E2E sob demanda.

## Convenções

- Páginas são Server Components que buscam dados com `createClient()` (`src/lib/supabase/server.ts`); mutações são Server Actions em `src/lib/actions/*.ts` com `revalidatePath`.
- Arquivos `"use server"` só podem exportar funções async (checado por `scripts/check-use-server.mjs`).
- Strings sempre via next-intl; `messages/pt-BR.json`, `en.json` e `es.json` precisam ter as mesmas chaves e os mesmos placeholders (`scripts/check-messages.mjs`).
- Tabelas com `user_id` usam RLS "all own"; tabelas filhas validam o pai com `with check (exists ...)` (FKs ignoram RLS). Dados privilegiados (assinatura, cotações, rate limit) só são escritos pela service role.
- Tom do produto: acolhedor, nunca punitivo (sem "falhou", sem marcar dias perdidos).

## Estrutura

- `src/app/[locale]/(auth)` login/cadastro · `(app)` módulos autenticados · `(legal)` Privacidade e Termos (públicas)
- `src/app/api` crons, webhook da Stripe, cartões de compartilhamento, exportação de dados
- `src/lib/actions` Server Actions · `src/lib/<feature>` lógica por módulo (parte pura testável separada da que usa Supabase)
- `src/proxy.ts` sessão, idioma e proteção de rotas · `next.config.ts` cabeçalhos de segurança/CSP
- `supabase/migrations` schema, RLS e conteúdo inicial · `scripts/db` testes de banco · `e2e` testes de ponta a ponta

## Segurança e privacidade (resumo)

RLS em todas as tabelas; cápsula selada no banco (colunas revogadas); conteúdo premium protegido por RLS e mídia por URL assinada; rate limiting no banco; CSP e demais cabeçalhos; webhook com assinatura verificada; analytics só com consentimento e pseudonimizado; exportar/excluir conta em Configurações. As afirmações enviam textos de sonhos e objetivos à Anthropic (avisado na tela e na política de privacidade).
