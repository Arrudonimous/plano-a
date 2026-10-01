# Plano A

Sonhe. Planeje. Aja. Avance.

Plataforma de desenvolvimento pessoal e planejamento de vida, instalável como PWA no Android e no iPhone. Este repositório contém o **núcleo essencial (MVP)**; o restante da visão do produto está documentado em [ROADMAP.md](./ROADMAP.md).

## Stack

- [Next.js](https://nextjs.org) (App Router) — Next 16, usa `proxy.ts` (não `middleware.ts`, renomeado na v16)
- [Supabase](https://supabase.com) (Postgres, Auth, RLS)
- [next-intl](https://next-intl.dev) (i18n, pt-BR ativo, en como skeleton)
- [Serwist](https://serwist.pages.dev) (service worker / PWA) — requires webpack; Next 16 defaults to Turbopack, so `dev`/`build` scripts pin `--webpack` until Serwist adds Turbopack support
- Tailwind CSS v4

## Configuração

1. Crie um projeto no [Supabase](https://supabase.com) e aplique as migrations em `supabase/migrations/` (via SQL editor ou `supabase db push` com a CLI).
2. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (uso restrito a `src/lib/supabase/admin.ts`, nunca exposto ao client)
   - `NEXT_PUBLIC_SITE_URL` (usado no redirect de confirmação de e-mail)
3. **Cápsula do Tempo** (e-mail agendado) — veja a seção abaixo para `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `CRON_SECRET`.
4. **Afirmações diárias (IA)** — veja a seção abaixo para `ANTHROPIC_API_KEY`.
5. Gere os tipos reais do banco (substitui o arquivo hand-authored):
   ```bash
   supabase gen types typescript --linked > src/lib/types/database.types.ts
   ```

## Cápsula do Tempo (e-mail agendado)

As cápsulas são enviadas por um job diário que chama `GET /api/cron/deliver-capsules`. Para ativar:

1. Crie uma conta no [Resend](https://resend.com), verifique o domínio de envio e gere uma API key.
2. Defina no ambiente (`.env.local` e no provedor de hospedagem):
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` — ex.: `Plano A <capsula@seu-dominio.com>` (precisa ser de um domínio verificado)
   - `CRON_SECRET` — um segredo longo e aleatório; a rota responde `401` sem `Authorization: Bearer <CRON_SECRET>`
3. Agende a chamada:
   - **Vercel**: o `vercel.json` já agenda o job todo dia às 12:00 UTC (09:00 em Brasília). Com `CRON_SECRET` definido no projeto, a Vercel envia o header `Authorization` automaticamente. No plano Hobby, crons só podem rodar uma vez por dia.
   - **Outro host**: agende `curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron/deliver-capsules` uma vez por dia.

A entrega é idempotente (cada cápsula é "reivindicada" antes do envio) e falhas são tentadas de novo nas execuções seguintes, até 5 vezes. A data de envio vale no fuso horário do usuário (Configurações).

## Afirmações diárias (IA)

A página `/afirmacoes` mostra 3 afirmações novas por dia, geradas pela API do Claude a partir dos sonhos em aberto e dos objetivos da pessoa (evitando repetir as dos últimos 14 dias). A geração acontece na primeira vez que a pessoa abre a página no dia (no fuso dela) e é limitada a uma por usuário por dia.

- Defina `ANTHROPIC_API_KEY` (Anthropic Console) no ambiente.
- Modelo: `claude-opus-5-5` por padrão. Para custo menor, defina `AFFIRMATIONS_MODEL=claude-sonnet-5-5` (metade do preço por token). Valores aceitos: `claude-opus-5-5`, `claude-opus-5`, `claude-sonnet-5-5`, `claude-fable-5-1`.
- **Privacidade:** para gerar as afirmações, os textos de sonhos e objetivos são enviados à Anthropic. A página avisa isso ao usuário; vale refletir na política de privacidade do produto.

## Rodando localmente

```bash
npm run dev
```

O service worker (Serwist) fica desabilitado em desenvolvimento — para testar o comportamento de PWA/offline, use um build de produção:

```bash
npm run build
npm run start
```

## Instalabilidade como PWA

- **Lighthouse**: `npx lighthouse http://localhost:3000/hoje --view` contra o build de produção.
- **Android (Chrome)**: exige HTTPS real (ex.: preview da Vercel); o botão "Instalar Plano A" aparece quando o navegador dispara `beforeinstallprompt`.
- **iOS (Safari)**: não existe `beforeinstallprompt`; o app mostra uma dica manual ("Compartilhar → Adicionar à Tela de Início").

## Estrutura

- `src/app/[locale]/(auth)` — login/cadastro (não autenticado)
- `src/app/[locale]/(app)` — Meu Dia, Sonhos, Objetivos, Minha Ação, Configurações (autenticado)
- `src/lib/actions/` — Server Actions por domínio
- `src/lib/supabase/` — clientes Supabase (browser, server, admin, proxy)
- `src/proxy.ts` — sessão Supabase + roteamento de locale + proteção de rotas
- `supabase/migrations/` — schema SQL, incluindo as políticas de RLS

## Próximos passos

Veja [ROADMAP.md](./ROADMAP.md) para os módulos adiados (Vision Board, Cápsula do Tempo, Financeiro, Academia, pagamentos, admin, etc.) e o que falta para produção.
