import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { buildCapsuleEmail } from "@/lib/email/capsuleEmail";
import { addDaysISO, todayInTimeZone } from "@/lib/utils/dates";
import {
  CAPSULE_CLAIM_TIMEOUT_MS,
  CAPSULE_MAX_DELIVERY_ATTEMPTS,
} from "@/lib/capsules/config";

const BATCH_SIZE = 100;

export interface DeliveryResult {
  delivered: number;
  failed: number;
  skipped: number;
}

/**
 * Sends every capsule whose delivery date has arrived in its owner's timezone.
 * Safe to run more than once (and concurrently): each capsule is claimed with a
 * conditional update before sending, and failures are retried on later runs
 * up to CAPSULE_MAX_DELIVERY_ATTEMPTS.
 */
export async function deliverDueCapsules(): Promise<DeliveryResult> {
  const admin = createAdminClient();
  const now = new Date();
  const result: DeliveryResult = { delivered: 0, failed: 0, skipped: 0 };

  // Fuso do usuário pode estar até um dia à frente de UTC.
  const horizon = addDaysISO(now.toISOString().slice(0, 10), 1);
  const { data: candidates, error } = await admin
    .from("time_capsules")
    .select("*")
    .is("delivered_at", null)
    .lt("delivery_attempts", CAPSULE_MAX_DELIVERY_ATTEMPTS)
    .lte("deliver_on", horizon)
    .order("deliver_on", { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw error;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staleClaimBefore = new Date(now.getTime() - CAPSULE_CLAIM_TIMEOUT_MS).toISOString();

  for (const capsule of candidates ?? []) {
    const { data: profile } = await admin
      .from("profiles")
      .select("timezone, preferred_language")
      .eq("id", capsule.user_id)
      .single();

    const timezone = profile?.timezone ?? "America/Sao_Paulo";
    if (capsule.deliver_on > todayInTimeZone(timezone)) {
      result.skipped++;
      continue;
    }

    const { data: claimed } = await admin
      .from("time_capsules")
      .update({
        claimed_at: now.toISOString(),
        delivery_attempts: capsule.delivery_attempts + 1,
      })
      .eq("id", capsule.id)
      .is("delivered_at", null)
      .or(`claimed_at.is.null,claimed_at.lt.${staleClaimBefore}`)
      .select("id")
      .maybeSingle();
    if (!claimed) {
      result.skipped++;
      continue;
    }

    try {
      const { data: userData } = await admin.auth.admin.getUserById(capsule.user_id);
      const to = userData.user?.email;
      if (!to) throw new Error("usuário sem e-mail");

      await sendEmail({
        to,
        ...buildCapsuleEmail({
          language: profile?.preferred_language ?? null,
          message: capsule.message,
          createdAt: capsule.created_at,
          siteUrl,
        }),
      });

      await admin
        .from("time_capsules")
        .update({
          delivered_at: new Date().toISOString(),
          claimed_at: null,
          delivery_error: null,
        })
        .eq("id", capsule.id);
      result.delivered++;
    } catch (err) {
      await admin
        .from("time_capsules")
        .update({
          claimed_at: null,
          delivery_error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
        })
        .eq("id", capsule.id);
      result.failed++;
    }
  }

  return result;
}
