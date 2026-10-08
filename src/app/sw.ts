import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.hostname.endsWith(".supabase.co"),
      handler: new NetworkOnly(),
    },
    // Dados pessoais nunca ficam no cache do aparelho (sobreviveriam ao logout em
    // aparelhos compartilhados): respostas de /api, páginas (HTML) e payloads RSC
    // vão sempre à rede. Só estáticos (JS, CSS, fontes, imagens) usam cache.
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin &&
        (request.destination === "document" ||
          request.mode === "navigate" ||
          request.headers.get("RSC") === "1" ||
          request.headers.has("Next-Router-State-Tree")),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
