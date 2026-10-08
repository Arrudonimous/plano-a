import { test } from "node:test";
import assert from "node:assert/strict";
import { localized, localizedList, parseBody } from "./localized.ts";
import { parseMedia } from "./media.ts";

test("localized: idioma pedido, fallback e vazios", () => {
  const v = { "pt-BR": "Olá", en: "Hello" };
  assert.equal(localized(v, "en"), "Hello");
  assert.equal(localized(v, "es"), "Olá");
  assert.equal(localized({ en: "Hi", "pt-BR": "  " }, "pt-BR"), "Hi");
  assert.equal(localized({ fr: "Salut" }, "en"), "Salut");
  assert.equal(localized(null, "en"), "");
  assert.equal(localized([], "en"), "");
  assert.equal(localized("texto", "en"), "texto");
});

test("localizedList ignora itens vazios", () => {
  assert.deepEqual(localizedList([{ en: "a" }, {}, { "pt-BR": "b" }], "pt-BR"), ["a", "b"]);
  assert.deepEqual(localizedList("x", "en"), []);
});

test("parseBody separa parágrafos e listas", () => {
  assert.deepEqual(parseBody("Um\nmesmo parágrafo\n\n- a\n- b\n\nFim"), [
    { type: "p", text: "Um mesmo parágrafo" },
    { type: "ul", items: ["a", "b"] },
    { type: "p", text: "Fim" },
  ]);
  assert.deepEqual(parseBody("  \n\n "), []);
});

test("parseMedia: embeds, arquivos, storage e entradas inválidas", () => {
  assert.deepEqual(parseMedia("https://youtu.be/dQw4w9WgXcQ"), {
    type: "youtube",
    embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  });
  assert.equal(parseMedia("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.type, "youtube");
  assert.deepEqual(parseMedia("https://vimeo.com/123456789"), {
    type: "vimeo",
    embedUrl: "https://player.vimeo.com/video/123456789",
  });
  assert.deepEqual(parseMedia("https://cdn.exemplo.com/a/b.mp3"), {
    type: "file",
    url: "https://cdn.exemplo.com/a/b.mp3",
    audio: true,
  });
  assert.deepEqual(parseMedia("storage:aulas/x.mp4"), { type: "storage", path: "aulas/x.mp4", audio: false });
  for (const bad of ["", null, "javascript:alert(1)", "http://youtu.be/dQw4w9WgXcQ", "storage:../x", "https://evil.com/page", "https://youtube.com/watch?v=<script>"]) {
    assert.equal(parseMedia(bad as string | null), null, String(bad));
  }
});

import { isValidSlug, readLocalized, readLocalizedSteps, stepsToLines } from "./form.ts";

function form(values: Record<string, string>) {
  return { get: (name: string) => (name in values ? values[name] : null) };
}

test("readLocalized guarda só idiomas preenchidos", () => {
  assert.deepEqual(readLocalized(form({ "title.pt-BR": " Olá ", "title.en": "  ", "title.es": "Hola" }), "title"), {
    "pt-BR": "Olá",
    es: "Hola",
  });
  assert.deepEqual(readLocalized(form({}), "title"), {});
});

test("readLocalizedSteps alinha passos por linha entre idiomas", () => {
  const steps = readLocalizedSteps(
    form({ "steps.pt-BR": "um\n\ndois\ntrês", "steps.en": "one\ntwo" }),
    "steps",
  );
  assert.deepEqual(steps, [
    { "pt-BR": "um", en: "one" },
    { "pt-BR": "dois", en: "two" },
    { "pt-BR": "três" },
  ]);
  assert.equal(stepsToLines(steps, "en"), "one\ntwo\n");
});

test("isValidSlug", () => {
  assert.equal(isValidSlug("clt-para-negocio"), true);
  for (const bad of ["", "a", "Maiúscula", "com espaço", "x".repeat(61), "../x"]) assert.equal(isValidSlug(bad), false, bad);
});
