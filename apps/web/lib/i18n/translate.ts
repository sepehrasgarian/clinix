import type { Lang } from "@/lib/i18n/languages";

export type Dictionary = Record<string, string>;

const CJK_GAP = /([㐀-鿿＀-￯　-〿])\s+(?=[㐀-鿿＀-￯　-〿])/g;

/** Chinese is written without spaces between characters; a space next to Latin letters stays. */
export const tightenChinese = (text: string) => text.replace(CJK_GAP, "$1");

/**
 * Looks an English string up in a dictionary keyed by that string. A string that is missing falls back to
 * English, so a gap in a translation shows English, never a raw key.
 */
export function translateString(text: string, dict: Dictionary | undefined, lang: Lang): string {
  const found = dict?.[text];
  if (found === undefined || found === "") return text;
  return lang === "zh" ? tightenChinese(found) : found;
}

/** Returns a copy of `value` with every string translated. Arrays and objects keep their shape. */
export function translateTree<T>(value: T, dict: Dictionary | undefined, lang: Lang): T {
  if (lang === "en" || !dict) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return translateString(v, dict, lang);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}

/** Fills {0}, {1}... placeholders by position. */
export const fill = (text: string, ...values: (string | number)[]) => text.replace(/\{(\d+)\}/g, (m, i) => String(values[Number(i)] ?? m));
