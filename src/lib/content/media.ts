export type Media =
  | { type: "youtube"; embedUrl: string }
  | { type: "vimeo"; embedUrl: string }
  | { type: "storage"; path: string; audio: boolean }
  | { type: "file"; url: string; audio: boolean }
  | null;

const AUDIO_EXT = /\.(mp3|m4a|wav|ogg|weba)$/i;
const FILE_EXT = /\.(mp4|webm|mov|mp3|m4a|wav|ogg|weba)$/i;

/**
 * Interpreta o campo media_url de uma aula. Só aceita hosts conhecidos para
 * embed (YouTube/Vimeo), arquivos https diretos ou "storage:<caminho>".
 */
export function parseMedia(raw: string | null | undefined): Media {
  const value = raw?.trim();
  if (!value) return null;

  if (value.startsWith("storage:")) {
    const path = value.slice("storage:".length).replace(/^\/+/, "");
    if (!path || path.includes("..")) return null;
    return { type: "storage", path, audio: AUDIO_EXT.test(path) };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return /^[\w-]{6,20}$/.test(id)
      ? { type: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` }
      : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.pathname.startsWith("/embed/")
      ? url.pathname.split("/")[2]
      : url.searchParams.get("v");
    return id && /^[\w-]{6,20}$/.test(id)
      ? { type: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` }
      : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^\d{4,15}$/.test(id)
      ? { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` }
      : null;
  }
  if (FILE_EXT.test(url.pathname)) {
    return { type: "file", url: url.toString(), audio: AUDIO_EXT.test(url.pathname) };
  }
  return null;
}
