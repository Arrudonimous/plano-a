# Testes de ponta a ponta

Rodam o app compilado contra um **Supabase local de verdade** (Postgres, Auth, REST e Storage),
com um navegador em viewport de celular. Resend, Stripe, Claude e a API de cotações são
substituídos por um stub de `fetch` (`stub-fetch.cjs`) que registra as chamadas.

## Como rodar

```bash
# 1. Supabase local (precisa de Docker). Em uma pasta fora do repo:
supabase init && rm -rf supabase/migrations && ln -s "$PWD_DO_REPO/supabase/migrations" supabase/migrations
supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,mailpit,postgres-meta,supavisor
#    (em supabase/config.toml: [auth.email] enable_confirmations = false)

# 2. .env.local apontando para ele (URLs/keys vêm de `supabase status`) + segredos de teste:
#    CRON_SECRET=test-cron-secret  ANALYTICS_SALT=test-salt  STRIPE_WEBHOOK_SECRET=whsec_test
#    RESEND_API_KEY=re_test  RESEND_FROM_EMAIL="Plano A <capsula@teste.com>"  ANTHROPIC_API_KEY=sk-ant-test
#    STRIPE_SECRET_KEY=sk_test_x  STRIPE_PRICE_MONTHLY=price_m  STRIPE_PRICE_YEARLY=price_y

# 3. Build e servidor com o stub:
npm run build
NODE_OPTIONS="--require $PWD/e2e/stub-fetch.cjs" npm start

# 4. Em outro terminal:
for f in smoke flows money-content admin-account integrations affirmations-failure api-security sw-privacy a11y; do node e2e/$f.mjs || break; done
```

Variáveis úteis: `E2E_BASE` (URL do app), `E2E_DB` (conexão do Postgres), `CHROMIUM` (caminho do navegador).
Os testes criam usuários novos a cada execução e zeram `rate_limits` antes de cada cadastro.

Para validar só o banco (migrations + RLS) sem Docker, use `scripts/db/test.sh` (Postgres local).
