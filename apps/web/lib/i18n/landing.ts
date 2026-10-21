import { copy } from "@/lib/copy";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Lang } from "@/lib/i18n/languages";
import { translateTree } from "@/lib/i18n/translate";

export type LandingCopy = typeof copy.landing;

const cache = new Map<Lang, LandingCopy>();

/** The landing copy in one language. Built once per language and reused. */
export function landingFor(lang: Lang): LandingCopy {
  const hit = cache.get(lang);
  if (hit) return hit;
  const made = translateTree(copy.landing, dictionaries[lang], lang);
  cache.set(lang, made);
  return made;
}
