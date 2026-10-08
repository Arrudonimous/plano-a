import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { track } from "@/lib/analytics";
import { loadProgress } from "@/lib/progress/load";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";
import { todayInTimeZone } from "@/lib/utils/dates";

const LOCALES = ["pt-BR", "en", "es"];
const NAVY = "#1e2a4a";
const NAVY_LIGHT = "#34436b";
const AMBER = "#e2a15c";

/** Cartão compartilhável (1080×1350) de uma conquista ou de um sonho realizado. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id") ?? "";
  const lang = url.searchParams.get("lang") ?? "pt-BR";
  const locale = LOCALES.includes(lang) ? lang : "pt-BR";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await rateLimit(`share:${user.id}`, 40, 3600))) return new Response("Too many requests", { status: 429 });

  const t = await getTranslations({ locale, namespace: "share" });
  let eyebrow = "";
  let title = "";
  let subtitle = "";

  if (type === "achievement") {
    const tp = await getTranslations({ locale, namespace: "progresso" });
    const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
    const timeZone = profile?.timezone ?? "America/Sao_Paulo";
    const { achievements } = await loadProgress(supabase, user.id, timeZone, todayInTimeZone(timeZone));
    const achievement = achievements.find((a) => a.id === id);
    // Só gera cartão de conquista que a pessoa realmente desbloqueou.
    if (!achievement?.unlocked) return new Response("Not found", { status: 404 });
    eyebrow = t("achievement");
    title = tp(`achievements.${id}.title`);
    subtitle = tp(`achievements.${id}.description`);
  } else if (type === "dream") {
    const { data: dream } = await supabase
      .from("dreams")
      .select("description, realized_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!dream?.realized_at) return new Response("Not found", { status: 404 });
    eyebrow = t("dreamRealized");
    title = dream.description.length > 140 ? `${dream.description.slice(0, 137)}...` : dream.description;
    subtitle = t("dreamLine");
  } else {
    return new Response("Bad request", { status: 400 });
  }

  await track("share_card_created", { type });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 90,
          background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_LIGHT} 100%)`,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#ffffff",
              color: NAVY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>Plano A</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 34, color: AMBER, letterSpacing: 3, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: title.length > 60 ? 64 : 88, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 38, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>{subtitle}</div>
        </div>

        <div style={{ fontSize: 34, color: "rgba(255,255,255,0.7)" }}>{t("tagline")}</div>
      </div>
    ),
    { width: 1080, height: 1350, headers: { "Cache-Control": "private, no-store" } },
  );
}
