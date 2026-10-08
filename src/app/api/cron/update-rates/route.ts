import { isCronAuthorized } from "@/lib/cron";
import { updateExchangeRates } from "@/lib/finance/rates";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    return Response.json(await updateExchangeRates());
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 502 },
    );
  }
}
