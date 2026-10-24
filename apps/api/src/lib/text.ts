/** Lowercase, accents folded, so "Montréal" matches "montreal". */
export const fold = (s: string): string => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** A business name reduced to its letters and digits, so "Dr. Lee Dental" and "DR LEE DENTAL" are the same clinic. */
export const nameKey = (name: string): string => fold(name).replace(/[^a-z0-9]+/g, " ").trim();
