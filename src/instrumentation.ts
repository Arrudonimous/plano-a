import type { Instrumentation } from "next";

/**
 * Registra erros de requisição do servidor em JSON (um por linha, fácil de filtrar
 * nos logs da Vercel). Se ERROR_WEBHOOK_URL estiver definida (Slack, Discord,
 * Sentry via relay etc.), envia também um resumo curto. Nunca inclui corpo de requisição.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const err = error as Error & { digest?: string };
  const entry = {
    level: "error",
    message: err.message,
    digest: err.digest,
    path: request.path,
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    at: new Date().toISOString(),
  };
  console.error(JSON.stringify(entry));

  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Plano A • ${entry.method} ${entry.route ?? entry.path}: ${entry.message}`.slice(0, 500) }),
      });
    } catch {
      // melhor esforço
    }
  }
};
