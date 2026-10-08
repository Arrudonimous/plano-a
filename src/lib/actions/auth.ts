"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    const t = await getTranslations("auth");
    return { error: t("missingFields") };
  }

  if (!(await rateLimit(`signup:${await clientIp()}`, 10, 3600))) {
    const t = await getTranslations("auth");
    return { error: t("tooManyAttempts") };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();
  redirect({ href: "/hoje", locale });
  return undefined as never;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const ip = await clientIp();
  if (
    !(await rateLimit(`login-ip:${ip}`, 30, 600)) ||
    !(await rateLimit(`login-email:${email.toLowerCase()}`, 10, 600))
  ) {
    const t = await getTranslations("auth");
    return { error: t("tooManyAttempts") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const t = await getTranslations("auth");
    return { error: t("invalidCredentials") };
  }

  const locale = await getLocale();
  redirect({ href: "/hoje", locale });
  return undefined as never;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const locale = await getLocale();
  redirect({ href: "/login", locale });
}
