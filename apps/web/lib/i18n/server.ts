import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, toLang, type Lang } from "@/lib/i18n/languages";
import { landingFor } from "@/lib/i18n/landing";

/** The visitor's language from the cookie. English when there is no request (tests) or no cookie. */
export async function getLang(): Promise<Lang> {
  try {
    return toLang((await cookies()).get(LANG_COOKIE)?.value);
  } catch {
    return DEFAULT_LANG;
  }
}

export async function getLanding() {
  return landingFor(await getLang());
}
