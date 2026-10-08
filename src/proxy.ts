import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { getUserForRequest } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

const AUTH_PATHS = ["/login", "/signup"];
// Páginas públicas (acessíveis sem login).
const PUBLIC_PATHS = ["/privacidade", "/termos"];

function getLocaleFromPathname(pathname: string): string | null {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return null;
}

function withLocalePrefix(locale: string | null, path: string) {
  return locale ? `/${locale}${path}` : path;
}

export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request) ?? NextResponse.next();

  const user = await getUserForRequest(request, response);

  const locale = getLocaleFromPathname(request.nextUrl.pathname);
  const pathWithoutLocale = locale
    ? request.nextUrl.pathname.slice(locale.length + 1) || "/"
    : request.nextUrl.pathname;

  const isAuthPath = AUTH_PATHS.includes(pathWithoutLocale);

  if (!user && !isAuthPath && !PUBLIC_PATHS.includes(pathWithoutLocale)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = withLocalePrefix(locale, "/login");
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = withLocalePrefix(locale, "/hoje");
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|auth|_next|favicon.ico|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|icons/).*)",
  ],
};
