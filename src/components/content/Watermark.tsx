import type { ReactNode } from "react";

/**
 * Marca d'água discreta com o e-mail de quem está vendo. Não impede captura de
 * tela (a web não permite), mas desencoraja o vazamento de conteúdo premium e
 * permite identificar a origem de um vazamento.
 */
export function Watermark({ text, children }: { text: string; children: ReactNode }) {
  const escaped = text.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="140"><text x="20" y="80" font-family="sans-serif" font-size="14" fill="#000" transform="rotate(-20 140 70)">${escaped}</text></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return (
    <div className="relative" onContextMenu={(event) => event.preventDefault()}>
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none opacity-[0.07] dark:invert"
        style={{ backgroundImage: url }}
      />
    </div>
  );
}
