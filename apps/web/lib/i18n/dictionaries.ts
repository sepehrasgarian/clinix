import fr from "@/lib/i18n/dictionaries/fr.json";
import es from "@/lib/i18n/dictionaries/es.json";
import ru from "@/lib/i18n/dictionaries/ru.json";
import zh from "@/lib/i18n/dictionaries/zh.json";
import type { Lang } from "@/lib/i18n/languages";
import type { Dictionary } from "@/lib/i18n/translate";

/** English has no dictionary: the source strings are the English text. */
export const dictionaries: Record<Lang, Dictionary | undefined> = { en: undefined, fr, es, ru, zh };
