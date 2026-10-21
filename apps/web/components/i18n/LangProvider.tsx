"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LANG, LANG_INFO, type Lang } from "@/lib/i18n/languages";
import { copy } from "@/lib/copy";
import type { LandingCopy } from "@/lib/i18n/landing";

type Value = { lang: Lang; locale: string; landing: LandingCopy };

/** Defaults to English so a component renders fine without a provider, as in tests. */
const LangContext = createContext<Value>({ lang: DEFAULT_LANG, locale: LANG_INFO[DEFAULT_LANG].locale, landing: copy.landing });

/** Hands the language and its translated landing copy to client components. The server picks the language from the cookie. */
export function LangProvider({ lang, landing, children }: { lang: Lang; landing: LandingCopy; children: ReactNode }) {
  return <LangContext.Provider value={{ lang, locale: LANG_INFO[lang].locale, landing }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useLanding = () => useContext(LangContext).landing;
