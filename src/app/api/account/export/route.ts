import { loadCapsules } from "@/lib/capsules/load";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";

// Tabelas com dados da pessoa (a RLS já restringe ao próprio usuário).
const TABLES = [
  "profiles", "dreams", "objectives", "daily_actions", "habits", "habit_checkins",
  "dream_board_items", "dream_board_comments", "affirmations", "gratitude_entries",
  "projects", "project_steps", "finance_items", "finance_debts", "finance_reserve",
  "finance_goals", "finance_transactions", "spirit_settings", "spirit_entries",
  "program_enrollments", "lesson_progress", "subscriptions",
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!(await rateLimit(`export:${user.id}`, 5, 3600))) {
    return new Response("Too many requests", { status: 429 });
  }

  const data: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
  };
  for (const table of TABLES) {
    const column = table === "profiles" ? "id" : "user_id";
    const { data: rows } = await supabase.from(table).select("*").eq(column as never, user.id);
    data[table] = rows ?? [];
  }
  // Cápsulas pendentes seguem seladas: só metadados; as entregues trazem o texto.
  data.time_capsules = await loadCapsules(supabase, user.id);

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plano-a-meus-dados.json"',
      "Cache-Control": "no-store",
    },
  });
}
