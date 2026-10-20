import { z } from "zod";

/**
 * Every discipline the product knows. Ids are stable; labels are what owners see.
 * `folder` is the guide folder name in the private guides repository; `aliases` are other
 * folder names that map to the same discipline. `googleTypes` identify a listing's discipline.
 */
export type DisciplineInfo = {
  id: string;
  label: string;
  folder: string;
  aliases?: string[];
  googleTypes?: string[];
  common?: boolean;
};

export const DISCIPLINES: readonly DisciplineInfo[] = [
  { id: "dentistry", label: "Dentistry", folder: "Dentistry", aliases: ["Dental Clinic"], googleTypes: ["dentist", "dental_clinic"], common: true },
  { id: "dental_hygiene", label: "Dental hygiene", folder: "Dental Hygiene", googleTypes: ["dental_hygienist"], common: true },
  { id: "physiotherapy", label: "Physiotherapy", folder: "Physiotherapy", aliases: ["Physical Therapy - Physiotherapy", "Physical Rehabilitation"], googleTypes: ["physiotherapist", "physical_therapy_clinic", "physical_therapist"], common: true },
  { id: "chiropractic", label: "Chiropractic", folder: "Chiropractic", googleTypes: ["chiropractor"], common: true },
  { id: "massage", label: "Massage therapy", folder: "Massage Therapy", googleTypes: ["massage", "massage_therapist"], common: true },
  { id: "naturopathy", label: "Naturopathy", folder: "Naturopathy", aliases: ["Naturopathic Medicine"], googleTypes: ["naturopath", "alternative_medicine_practitioner"], common: true },
  { id: "optometry", label: "Optometry", folder: "Optometry", googleTypes: ["optometrist", "eye_care_center", "optician"], common: true },
  { id: "dermatology", label: "Dermatology", folder: "Dermatology", googleTypes: ["dermatologist", "skin_care_clinic"], common: true },
  { id: "medical_aesthetics", label: "Medical aesthetics", folder: "Medical Aesthetics", aliases: ["Aesthetic Care"], googleTypes: ["medical_spa", "beauty_salon"], common: true },
  { id: "psychotherapy", label: "Psychotherapy", folder: "Psychotherapy", googleTypes: ["psychotherapist", "mental_health_clinic"], common: true },
  { id: "family_medicine", label: "Family medicine", folder: "Medical - Primary Care - Family Medicine", googleTypes: ["doctor", "medical_clinic", "walk_in_clinic", "family_practice_physician", "general_practitioner"], common: true },
  { id: "osteopathy", label: "Osteopathy", folder: "Osteopathy", googleTypes: ["osteopath"], common: true },
  { id: "acupuncture", label: "Acupuncture", folder: "Acupuncture", googleTypes: ["acupuncturist", "acupuncture_clinic"] },
  { id: "chinese_medicine", label: "Chinese medicine", folder: "Chinese Medicine", googleTypes: ["chinese_medicine_clinic"] },
  { id: "athletic_therapy", label: "Athletic therapy", folder: "Athletic Therapy", aliases: ["Kinesiology - Athletic Therapy"], googleTypes: ["sports_medicine_clinic", "sports_medicine_physician"] },
  { id: "audiology", label: "Audiology", folder: "Audiology", googleTypes: ["audiologist", "hearing_aid_store"] },
  { id: "ayurveda", label: "Ayurveda", folder: "Ayurveda" },
  { id: "chiropody", label: "Chiropody", folder: "Chiropody", googleTypes: ["chiropodist"] },
  { id: "podiatry", label: "Podiatry", folder: "Podiatry", googleTypes: ["podiatrist"] },
  { id: "foot_care_nursing", label: "Foot care nursing", folder: "Foot Care Nursing" },
  { id: "coaching", label: "Coaching", folder: "Coaching", googleTypes: ["life_coach"] },
  { id: "consulting", label: "Consulting", folder: "Consulting" },
  { id: "colonics", label: "Colonics", folder: "Colonics" },
  { id: "counselling", label: "Counselling", folder: "Counselling", googleTypes: ["counselor", "family_counselor"] },
  { id: "day_spa", label: "Day spa", folder: "Day Spa", googleTypes: ["spa", "day_spa"] },
  { id: "dietetics", label: "Dietetics", folder: "Dietetics", googleTypes: ["dietitian"] },
  { id: "nutrition", label: "Nutrition", folder: "Nutrition", googleTypes: ["nutritionist"] },
  { id: "floating", label: "Float therapy", folder: "Floating" },
  { id: "functional_medicine", label: "Functional medicine", folder: "Functional Medicine" },
  { id: "homeopathy", label: "Homeopathy", folder: "Homeopathy", googleTypes: ["homeopath"] },
  { id: "iv_therapy", label: "IV therapy", folder: "IV Therapy" },
  { id: "imaging", label: "Medical imaging", folder: "Imaging", googleTypes: ["diagnostic_center", "medical_imaging"] },
  { id: "kinesiology", label: "Kinesiology", folder: "Kinesiology" },
  { id: "lactation_consulting", label: "Lactation consulting", folder: "Lactation Consulting" },
  { id: "laser_skin_hair", label: "Laser skin and hair", folder: "Laser Skin + Hair", googleTypes: ["laser_hair_removal_service"] },
  { id: "marriage_family_therapy", label: "Marriage and family therapy", folder: "Marriage - Family Therapy", googleTypes: ["marriage_or_relationship_counselor"] },
  { id: "medical_specialists", label: "Medical specialists", folder: "Medical Specialists" },
  { id: "midwifery", label: "Midwifery", folder: "Midwifery", googleTypes: ["midwife"] },
  { id: "occupational_therapy", label: "Occupational therapy", folder: "Occupational Therapy", googleTypes: ["occupational_therapist"] },
  { id: "personal_training", label: "Personal training", folder: "Personal Training", googleTypes: ["personal_trainer"] },
  { id: "pilates", label: "Pilates", folder: "Pilates", googleTypes: ["pilates_studio"] },
  { id: "plastic_surgery", label: "Plastic surgery", folder: "Plastic Surgery", googleTypes: ["plastic_surgeon"] },
  { id: "psychiatry", label: "Psychiatry", folder: "Psychiatry", googleTypes: ["psychiatrist"] },
  { id: "psychology", label: "Psychology", folder: "Psychology", googleTypes: ["psychologist"] },
  { id: "reflexology", label: "Reflexology", folder: "Reflexology", googleTypes: ["reflexologist"] },
  { id: "social_work", label: "Social work", folder: "Social Work", googleTypes: ["social_worker"] },
  { id: "speech_therapy", label: "Speech therapy", folder: "Speech Therapy", googleTypes: ["speech_pathologist"] },
  { id: "weight_management", label: "Weight management", folder: "Weight Management", googleTypes: ["weight_loss_service"] },
  { id: "womens_health", label: "Women's health", folder: "Women's Health", googleTypes: ["obstetrician_gynecologist", "womens_health_clinic"] },
  { id: "yoga", label: "Yoga", folder: "Yoga", googleTypes: ["yoga_studio"] },
  { id: "other", label: "Other health service", folder: "Other" },
] as const;

const IDS = DISCIPLINES.map((d) => d.id) as [string, ...string[]];
export const Discipline = z.enum(IDS);
export type Discipline = z.infer<typeof Discipline>;

export const DISCIPLINE_LABELS: Record<Discipline, string> = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d.label])) as Record<Discipline, string>;
export const COMMON_DISCIPLINES: Discipline[] = DISCIPLINES.filter((d) => d.common).map((d) => d.id as Discipline);

export const disciplineInfo = (id: Discipline): DisciplineInfo => DISCIPLINES.find((d) => d.id === id)!;

/** The guide folder names (primary and aliases) that may hold a discipline's reading guide. */
export const guideFolders = (id: Discipline): string[] => {
  const d = disciplineInfo(id);
  return [d.folder, ...(d.aliases ?? [])];
};

/** Disciplines implied by a listing's Google types. Common ones first. */
export function disciplinesFromTypes(types: string[]): Discipline[] {
  const set = new Set(types);
  return DISCIPLINES.filter((d) => d.googleTypes?.some((t) => set.has(t)))
    .sort((a, b) => Number(!!b.common) - Number(!!a.common))
    .map((d) => d.id as Discipline);
}

/** True when the listing's Google types match one of the given disciplines. `other` matches anything. */
export function matchesDisciplines(types: string[], disciplines: Discipline[]): boolean {
  if (disciplines.includes("other")) return true;
  const wanted = new Set(disciplines.flatMap((d) => disciplineInfo(d).googleTypes ?? []));
  return types.some((t) => wanted.has(t));
}
