import { Activity, Baby, Bone, Brain, Dumbbell, Ear, Eye, Flower2, Footprints, Hand, HeartPulse, Leaf, Scissors, Sparkles, Stethoscope, Syringe, type LucideIcon } from "lucide-react";
import { COMMON_DISCIPLINES, DISCIPLINES, type Discipline } from "@clinix/contracts";

export { COMMON_DISCIPLINES, DISCIPLINES, disciplinesFromListing, disciplinesFromName, disciplinesFromTypes } from "@clinix/contracts";

const ICONS: Partial<Record<Discipline, LucideIcon>> = {
  dentistry: Stethoscope,
  dental_hygiene: Sparkles,
  physiotherapy: Activity,
  chiropractic: Bone,
  massage: Hand,
  naturopathy: Leaf,
  optometry: Eye,
  dermatology: Sparkles,
  medical_aesthetics: Syringe,
  psychotherapy: Brain,
  psychology: Brain,
  psychiatry: Brain,
  counselling: Brain,
  family_medicine: HeartPulse,
  osteopathy: Bone,
  acupuncture: Flower2,
  chinese_medicine: Flower2,
  audiology: Ear,
  podiatry: Footprints,
  chiropody: Footprints,
  midwifery: Baby,
  personal_training: Dumbbell,
  athletic_therapy: Dumbbell,
  kinesiology: Dumbbell,
  plastic_surgery: Scissors,
  laser_skin_hair: Sparkles,
};

/** The icon badge ("sticker") for a discipline. Disciplines without their own icon share a generic one. */
export const disciplineIcon = (d: Discipline): LucideIcon => ICONS[d] ?? Stethoscope;

const BLURBS: Partial<Record<Discipline, string>> = {
  dentistry: "General and cosmetic dentistry, implants, emergencies",
  dental_hygiene: "Cleanings, scaling, whitening, prevention",
  physiotherapy: "Injury recovery, pain, post-surgery, sports",
  chiropractic: "Spine, posture, headaches, adjustments",
  massage: "Registered massage therapy",
  naturopathy: "Naturopathic and integrative care",
  optometry: "Eye exams, glasses, contact lenses",
  dermatology: "Skin conditions and treatments",
  medical_aesthetics: "Injectables, laser, skin treatments",
  psychotherapy: "Talk therapy and counselling",
  family_medicine: "Family doctors and walk-in care",
  osteopathy: "Manual osteopathic treatment",
};
export const disciplineBlurb = (d: Discipline): string => BLURBS[d] ?? DISCIPLINES.find((x) => x.id === d)?.label ?? "";
export const isCommon = (d: Discipline): boolean => COMMON_DISCIPLINES.includes(d);

/** Sticker colours: a pastel per discipline so the picker feels playful, not clinical. */
const STICKER_COLORS = ["#fde68a", "#bfdbfe", "#bbf7d0", "#fbcfe8", "#ddd6fe", "#fed7aa", "#a5f3fc", "#fecaca", "#d9f99d", "#e9d5ff"];
export function stickerColor(d: Discipline): string {
  const i = DISCIPLINES.findIndex((x) => x.id === d);
  return STICKER_COLORS[(i < 0 ? 0 : i) % STICKER_COLORS.length];
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[_-]+/g, " ").trim();

/** Everything an owner might type for a discipline: its name, its id, other names for it, and words clinics use in listings. */
const searchable = (d: DisciplineInfoLike) => [d.label, d.id, d.folder, ...(d.aliases ?? []), ...(d.nameKeywords ?? [])].map(fold);
type DisciplineInfoLike = (typeof DISCIPLINES)[number];

/**
 * Disciplines that match what was typed, best first: the name starts with it, then contains it, then another name
 * or keyword matches ("physio" finds Physiotherapy). Chosen ones are left out. With nothing typed, popular ones lead.
 * "Other" is never listed; the picker offers it when nothing matches.
 */
export function searchDisciplines(query: string, exclude: readonly Discipline[] = []): Discipline[] {
  const q = fold(query);
  const pool = DISCIPLINES.filter((d) => d.id !== "other" && !exclude.includes(d.id as Discipline));
  if (!q) return [...pool.filter((d) => d.common), ...pool.filter((d) => !d.common)].map((d) => d.id as Discipline);
  const rank = (d: DisciplineInfoLike) => {
    const label = fold(d.label);
    if (label.startsWith(q)) return 0;
    if (label.includes(q)) return 1;
    return searchable(d).some((t) => t.includes(q) || (t.length >= 3 && q.includes(t))) ? 2 : 3;
  };
  return pool.map((d) => ({ d, r: rank(d) })).filter((x) => x.r < 3).sort((a, b) => a.r - b.r).map((x) => x.d.id as Discipline);
}
