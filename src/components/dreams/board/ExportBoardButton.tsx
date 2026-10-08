"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { masonryLayout } from "@/lib/utils/masonry";
import type { BoardItem } from "@/components/dreams/board/types";

const WIDTH = 1080;
const PAD = 48;
const GAP = 24;
const COLUMNS = 2;
const COL_W = (WIDTH - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
const MAX_ITEMS = 24;
const FONT = "28px system-ui, -apple-system, 'Segoe UI', sans-serif";
const LINE_H = 38;
const TEXT_PAD = 28;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = url;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

/** Monta uma colagem PNG do mural no navegador (as imagens nunca saem do seu dispositivo). */
export function ExportBoardButton({ items, title }: { items: BoardItem[]; title: string }) {
  const t = useTranslations("mural");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function exportBoard() {
    setState("busy");
    try {
      const chosen = items.slice(0, MAX_ITEMS);
      const measure = document.createElement("canvas").getContext("2d")!;
      measure.font = FONT;

      const blocks = await Promise.all(
        chosen.map(async (item) => {
          if (item.kind === "image" && item.signedUrl) {
            const img = await loadImage(item.signedUrl);
            return { kind: "image" as const, img, height: Math.round((COL_W * img.height) / img.width) };
          }
          const lines = wrapLines(measure, item.content, COL_W - TEXT_PAD * 2);
          return { kind: "text" as const, lines, height: lines.length * LINE_H + TEXT_PAD * 2 };
        }),
      );

      const HEADER = 140;
      const FOOTER = 90;
      const { placements, height } = masonryLayout(blocks.map((b) => b.height), COLUMNS, GAP);
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEADER + height + FOOTER + PAD;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#faf7f2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1e2a4a";
      ctx.font = "600 52px system-ui, -apple-system, 'Segoe UI', sans-serif";
      ctx.fillText(title, PAD, PAD + 56);

      blocks.forEach((block, i) => {
        const x = PAD + placements[i].column * (COL_W + GAP);
        const y = HEADER + placements[i].y;
        if (block.kind === "image") {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, y, COL_W, block.height, 20);
          ctx.clip();
          ctx.drawImage(block.img, x, y, COL_W, block.height);
          ctx.restore();
        } else {
          ctx.fillStyle = "#1e2a4a";
          ctx.beginPath();
          ctx.roundRect(x, y, COL_W, block.height, 20);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = FONT;
          block.lines.forEach((line, n) => ctx.fillText(line, x + TEXT_PAD, y + TEXT_PAD + 28 + n * LINE_H));
        }
      });

      ctx.fillStyle = "#a8631f";
      ctx.font = "600 30px system-ui, -apple-system, 'Segoe UI', sans-serif";
      ctx.fillText("Plano A · Sonhe. Planeje. Aja. Avance.", PAD, canvas.height - PAD);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/png"),
      );
      const file = new File([blob], "meu-mural.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const href = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = href;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(href);
      }
      setState("idle");
    } catch (err) {
      setState(err instanceof DOMException && err.name === "AbortError" ? "idle" : "error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={exportBoard}
        disabled={state === "busy" || items.length === 0}
        className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-surface-muted disabled:opacity-50"
      >
        {state === "busy" ? t("exporting") : t("export")}
      </button>
      {state === "error" && (
        <span role="alert" className="text-xs text-danger">
          {t("exportError")}
        </span>
      )}
    </div>
  );
}
