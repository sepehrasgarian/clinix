export const LANGS = ["en", "fr", "es", "ru", "zh"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "clinx_lang";
export const LANG_STORAGE_KEY = "clinx_ui_language";
export const LANG_EVENT = "clinx:language-change";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Name in its own language, the short label for the switcher, and the locale for numbers and dates. */
export const LANG_INFO: Record<Lang, { name: string; short: string; locale: string }> = {
  en: { name: "English", short: "EN", locale: "en-CA" },
  fr: { name: "Français", short: "FR", locale: "fr-CA" },
  es: { name: "Español", short: "ES", locale: "es" },
  ru: { name: "Русский", short: "RU", locale: "ru" },
  zh: { name: "中文", short: "中文", locale: "zh-CN" },
};

/** Anything unknown, including a missing value, is English. */
export const toLang = (value: unknown): Lang => (LANGS as readonly string[]).includes(value as string) ? (value as Lang) : DEFAULT_LANG;
