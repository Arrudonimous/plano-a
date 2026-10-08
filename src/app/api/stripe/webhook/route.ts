import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscription } from "@/lib/billing/stripe";
import { mapSubscription, verifyStripeSignature } from "@/lib/billing/stripeCore";

interface StripeEvent {
  type: string;
  data: { object: Record<string, unknown> };
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook não configurado", { status: 503 });

  // O corpo bruto é necessário para validar a assinatura.
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
    return new Response("Assinatura inválida", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const object = event.data.object;
  let subscriptionId: string | null = null;
  let userId: string | null = null;

  if (event.type === "checkout.session.completed" && object.mode === "subscription") {
    subscriptionId = typeof object.subscription === "string" ? object.subscription : null;
    userId = typeof object.client_reference_id === "string" ? object.client_reference_id : null;
  } else if (event.type.startsWith("customer.subscription.")) {
    subscriptionId = typeof object.id === "string" ? object.id : null;
  } else {
    return Response.json({ ignored: event.type });
  }
  if (!subscriptionId) return Response.json({ ignored: "sem assinatura" });

  try {
    // Sempre relê na Stripe: o estado atual vale mais que a ordem de chegada dos eventos.
    const subscription = await getSubscription(subscriptionId);
    const admin = createAdminClient();

    userId = userId ?? subscription.metadata?.user_id ?? null;
    if (!userId) {
      const row = mapSubscription(subscription);
      const { data } = await admin
        .from("subscriptions")
        .select("user_id")
        .eq("provider_customer_id", row.provider_customer_id)
        .maybeSingle();
      userId = data?.user_id ?? null;
    }
    if (!userId) return Response.json({ ignored: "usuário não encontrado" });

    const { error } = await admin
      .from("subscriptions")
      .upsert({ user_id: userId, ...mapSubscription(subscription) });
    if (error) throw new Error(error.message);
  } catch (err) {
    // 500 faz a Stripe tentar de novo.
    return new Response(err instanceof Error ? err.message : "erro", { status: 500 });
  }

  return Response.json({ received: true });
}
