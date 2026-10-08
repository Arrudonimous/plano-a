import { isCronAuthorized } from "@/lib/cron";
import { deliverDueCapsules } from "@/lib/capsules/deliver";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await deliverDueCapsules();
  return Response.json(result);
}
