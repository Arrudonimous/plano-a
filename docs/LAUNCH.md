# Checklist de lançamento

Tudo aqui depende de contas, chaves, conteúdo ou decisões que só o dono do produto tem. O código está pronto e testado (ver README); falta ligar os serviços reais e validar com pessoas.

## 1. Supabase
- [ ] Criar o projeto (região perto dos usuários) e aplicar `supabase/migrations/0001` a `0020`, em ordem.
- [ ] Authentication → URL Configuration: **Site URL** = domínio de produção; **Redirect URLs** inclui `https://SEU-DOMINIO/auth/callback`.
- [ ] Authentication → confirmação de e-mail **ligada** em produção e um **SMTP próprio** (o SMTP padrão do Supabase tem limite baixo e é só para testes).
- [ ] Storage: conferir que os buckets `dream-board` e `content` existem (as migrations criam) e o limite de tamanho do seu plano (o app aceita até 50 MB por arquivo de aula).
- [ ] (Opcional) Regenerar `src/lib/types/database.types.ts` contra o projeto real (`supabase gen types typescript --linked`) e recolocar o alias `ObjectivePeriod`; o arquivo atual já foi gerado de um banco local com as mesmas migrations.
- [ ] Backups: ativar PITR/backups diários (plano pago) e anotar quem restaura.
- [ ] Inserir o primeiro admin (SQL no README).

## 2. Hospedagem (Vercel)
- [ ] Importar o repositório, definir **todas** as variáveis de `.env.example` que usar (as 4 do núcleo + `CRON_SECRET` são o mínimo).
- [ ] Domínio próprio com HTTPS (necessário para instalar o PWA no Android).
- [ ] Conferir os crons em `vercel.json` (plano Hobby: 1 execução por dia por cron).
- [ ] Rodar uma vez as cotações: `curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/cron/update-rates`.
- [ ] (Opcional) `ERROR_WEBHOOK_URL` apontando para um canal do Slack/Discord, e um monitor de disponibilidade externo.

## 3. E-mail (Resend)
- [ ] Verificar o domínio de envio (registros DNS SPF e DKIM) e definir `RESEND_API_KEY` e `RESEND_FROM_EMAIL`.
- [ ] Criar uma cápsula com data de amanhã numa conta de teste e conferir o e-mail recebido (e a pasta de spam).

## 4. Afirmações (Anthropic)
- [ ] Definir `ANTHROPIC_API_KEY`.
- [ ] Decidir o modelo padrão: `claude-opus-5-5` (padrão do código) custa o dobro de `claude-sonnet-5-5`. Estimativa: 1 chamada por usuário ativo por dia.
- [ ] Ler 20 a 30 afirmações geradas de verdade e avaliar a qualidade/tom (nunca foram vistas com a API real).

## 5. Pagamentos (Stripe)
- [ ] Começar em **modo teste**: criar produto "Premium" com preços recorrentes e definir `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` (os valores exibidos vêm da Stripe; **preços são decisão sua**).
- [ ] Ativar o **Customer Portal** (Settings → Billing → Customer portal): é ele que o botão "Gerenciar assinatura" abre.
- [ ] Webhook para `https://SEU-DOMINIO/api/stripe/webhook` com `checkout.session.completed` e `customer.subscription.created/updated/deleted`; copiar o segredo para `STRIPE_WEBHOOK_SECRET`.
- [ ] Testar com cartão de teste: assinar, ver o Premium ativar, cancelar no portal, excluir a conta (deve cancelar a assinatura).
- [ ] Configurar impostos/nota fiscal conforme seu CNPJ; só então virar para o modo real.
- [ ] Observação: assinatura `past_due` (cobrança falhou) perde o acesso premium até a Stripe regularizar. Se quiser um período de tolerância, ajuste `public.has_premium()`.

## 6. Conteúdo
- [ ] Revisar o **conteúdo inicial** (migrations 0015 e 0020 são um rascunho editorial): jornada CLT → Negócio, "Do sonho à ação" e a mentalização. A aula de formalização cita regras trabalhistas/tributárias do Brasil; peça revisão de um contador/advogado.
- [ ] Gravar/subir as mídias reais (vídeo ou áudio) pelo painel `/admin` e definir o que é gratuito e o que é Premium.
- [ ] Revisão humana do inglês e, principalmente, do **espanhol** (tradução feita sem revisor nativo).

## 7. Jurídico e privacidade
- [ ] Definir `NEXT_PUBLIC_COMPANY_NAME` e `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] Revisar com advogado a Política de Privacidade e os Termos de Uso (são rascunhos): bases legais, transferência internacional, prazo de guarda, direito de arrependimento, foro.
- [ ] Definir o encarregado/canal de titulares (LGPD) e o procedimento para pedidos que não cabem nos botões de exportar/excluir.
- [ ] Avisos de que o app não é aconselhamento financeiro/jurídico/médico já existem nos Termos e no Plano Financeiro; confirmar se o tom atende ao seu risco.

## 8. Testes em dispositivos reais (nunca feitos)
- [ ] Instalar o PWA no Android (Chrome) e no iPhone (Safari); conferir ícone, tela cheia e o botão/dica de instalação.
- [ ] Compartilhar um cartão de conquista e um sonho realizado pelo compartilhamento nativo.
- [ ] Exportar o Mural como imagem com imagens reais (depende de CORS do Storage: se falhar no navegador, ajustar CORS do bucket).
- [ ] Subir imagens do Mural vindas da câmera do celular (HEIC/tamanhos grandes).
- [ ] Percorrer os 3 idiomas em tela pequena.

## 9. Antes de abrir ao público
- [ ] Beta fechado com 10 a 20 pessoas por 2 semanas; coletar onde travam.
- [ ] Rodar `npm run check`, `npm run test:db` e a suíte `e2e/` contra o ambiente local uma última vez.
- [ ] Mergear o PR, conferir o deploy e fazer o roteiro manual: cadastro, um sonho, uma ação, uma aula, assinar (teste), exportar dados, excluir conta.

## Decisões em aberto (suas)
1. Preços e o que é Premium (hoje: conteúdos marcados como premium no painel + cápsula de até 5 anos).
2. Modelo das afirmações (custo x qualidade).
3. Como hospedar vídeo no longo prazo (hoje: YouTube/Vimeo ou Storage até 50 MB por arquivo).
4. Posicionamento: o app deve guiar a pessoa, não só planejar. A home já destaca "Sua jornada"; avalie se o texto e o conteúdo inicial entregam essa promessa.
