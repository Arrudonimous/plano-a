"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <div className="w-full max-w-sm space-y-8 py-16">
      <div className="text-center">
        <h1 className="flex justify-center">
          <Logo size={44} className="gap-3 text-2xl" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <h2 className="text-lg font-medium">{t("loginTitle")}</h2>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            {t("email")}
          </label>
          <Input id="email" type="email" name="email" required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            {t("password")}
          </label>
          <Input id="password" type="password" name="password" required />
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {t("loginButton")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-medium text-primary">
          {t("createAccount")}
        </Link>
      </p>
    </div>
  );
}
