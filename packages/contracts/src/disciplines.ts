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
  /** Words in a listing's name that mark the discipline, lowercase, any language we serve. */
  nameKeywords?: string[];
  common?: boolean;
};

/** Google types too broad to say what a clinic does. They still count when matching competitors, never when guessing. */
const GENERIC_TYPES = new Set(["medical_clinic", "doctor", "health", "medical_center", "clinic"]);

export const DISCIPLINES: readonly DisciplineInfo[] = [
  { id: "dentistry", label: "Dentistry", folder: "Dentistry", aliases: ["Dental Clinic"], googleTypes: ["dentist", "dental_clinic"], common: true, nameKeywords: ["dental","dentist","dentaire"] },
  { id: "dental_hygiene", label: "Dental hygiene", folder: "Dental Hygiene", googleTypes: ["dental_hygienist"], common: true, nameKeywords: ["hygien"] },
  { id: "physiotherapy", label: "Physiotherapy", folder: "Physiotherapy", aliases: ["Physical Therapy - Physiotherapy", "Physical Rehabilitation"], googleTypes: ["physiotherapist", "physical_therapy_clinic", "physical_therapist"], common: true, nameKeywords: ["physio","physical therapy","réadaptation","rehab"] },
  { id: "chiropractic", label: "Chiropractic", folder: "Chiropractic", googleTypes: ["chiropractor"], common: true, nameKeywords: ["chiro"] },
  { id: "massage", label: "Massage therapy", folder: "Massage Therapy", googleTypes: ["massage", "massage_therapist"], common: true, nameKeywords: ["massage","masso"] },
  { id: "naturopathy", label: "Naturopathy", folder: "Naturopathy", aliases: ["Naturopathic Medicine"], googleTypes: ["naturopath", "alternative_medicine_practitioner"], common: true, nameKeywords: ["naturo"] },
  { id: "optometry", label: "Optometry", folder: "Optometry", googleTypes: ["optometrist", "eye_care_center", "optician"], common: true, nameKeywords: ["optom","optique","eye care","vision"] },
  { id: "dermatology", label: "Dermatology", folder: "Dermatology", googleTypes: ["dermatologist", "skin_care_clinic"], common: true, nameKeywords: ["derm"] },
  { id: "medical_aesthetics", label: "Medical aesthetics", folder: "Medical Aesthetics", aliases: ["Aesthetic Care"], googleTypes: ["medical_spa", "beauty_salon"], common: true, nameKeywords: ["aesthetic","esthéti","esthetic","medspa","medi spa","med spa"] },
  { id: "psychotherapy", label: "Psychotherapy", folder: "Psychotherapy", googleTypes: ["psychotherapist", "mental_health_clinic"], common: true, nameKeywords: ["psychothera"] },
  { id: "family_medicine", label: "Family medicine", folder: "Medical - Primary Care - Family Medicine", googleTypes: ["doctor", "medical_clinic", "walk_in_clinic", "family_practice_physician", "general_practitioner"], common: true, nameKeywords: ["family medicine","family practice","médecine familiale","walk-in","walk in","sans rendez"] },
  { id: "osteopathy", label: "Osteopathy", folder: "Osteopathy", googleTypes: ["osteopath"], common: true, nameKeywords: ["osteo","ostéo"] },
  { id: "acupuncture", label: "Acupuncture", folder: "Acupuncture", googleTypes: ["acupuncturist", "acupuncture_clinic"], nameKeywords: ["acupunct", "acu"] },
  { id: "chinese_medicine", label: "Chinese medicine", folder: "Chinese Medicine", googleTypes: ["chinese_medicine_clinic"], nameKeywords: ["chinese medicine","tcm"] },
  { id: "athletic_therapy", label: "Athletic therapy", folder: "Athletic Therapy", aliases: ["Kinesiology - Athletic Therapy"], googleTypes: ["sports_medicine_clinic", "sports_medicine_physician"], nameKeywords: ["athletic therap"] },
  { id: "audiology", label: "Audiology", folder: "Audiology", googleTypes: ["audiologist", "hearing_aid_store"], nameKeywords: ["audio","hearing"] },
  { id: "ayurveda", label: "Ayurveda", folder: "Ayurveda" },
  { id: "chiropody", label: "Chiropody", folder: "Chiropody", googleTypes: ["chiropodist"], nameKeywords: ["chiropod"] },
  { id: "podiatry", label: "Podiatry", folder: "Podiatry", googleTypes: ["podiatrist"], nameKeywords: ["podiat"] },
  { id: "foot_care_nursing", label: "Foot care nursing", folder: "Foot Care Nursing" },
  { id: "coaching", label: "Coaching", folder: "Coaching", googleTypes: ["life_coach"] },
  { id: "consulting", label: "Consulting", folder: "Consulting" },
  { id: "colonics", label: "Colonics", folder: "Colonics" },
  { id: "counselling", label: "Counselling", folder: "Counselling", googleTypes: ["counselor", "family_counselor"], nameKeywords: ["counsel"] },
  { id: "day_spa", label: "Day spa", folder: "Day Spa", googleTypes: ["spa", "day_spa"], nameKeywords: ["day spa"] },
  { id: "dietetics", label: "Dietetics", folder: "Dietetics", googleTypes: ["dietitian"], nameKeywords: ["dietit","diét"] },
  { id: "nutrition", label: "Nutrition", folder: "Nutrition", googleTypes: ["nutritionist"], nameKeywords: ["nutrition"] },
  { id: "floating", label: "Float therapy", folder: "Floating" },
  { id: "functional_medicine", label: "Functional medicine", folder: "Functional Medicine" },
  { id: "homeopathy", label: "Homeopathy", folder: "Homeopathy", googleTypes: ["homeopath"], nameKeywords: ["homeopath","homéopath"] },
  { id: "iv_therapy", label: "IV therapy", folder: "IV Therapy" },
  { id: "imaging", label: "Medical imaging", folder: "Imaging", googleTypes: ["diagnostic_center", "medical_imaging"], nameKeywords: ["imaging","radiolog","imagerie"] },
  { id: "kinesiology", label: "Kinesiology", folder: "Kinesiology", nameKeywords: ["kinesio","kinésio"] },
  { id: "lactation_consulting", label: "Lactation consulting", folder: "Lactation Consulting" },
  { id: "laser_skin_hair", label: "Laser skin and hair", folder: "Laser Skin + Hair", googleTypes: ["laser_hair_removal_service"], nameKeywords: ["laser"] },
  { id: "marriage_family_therapy", label: "Marriage and family therapy", folder: "Marriage - Family Therapy", googleTypes: ["marriage_or_relationship_counselor"] },
  { id: "medical_specialists", label: "Medical specialists", folder: "Medical Specialists" },
  { id: "midwifery", label: "Midwifery", folder: "Midwifery", googleTypes: ["midwife"], nameKeywords: ["midwi","sage-femme"] },
  { id: "occupational_therapy", label: "Occupational therapy", folder: "Occupational Therapy", googleTypes: ["occupational_therapist"], nameKeywords: ["occupational therap","ergothérap"] },
  { id: "personal_training", label: "Personal training", folder: "Personal Training", googleTypes: ["personal_trainer"], nameKeywords: ["personal train"] },
  { id: "pilates", label: "Pilates", folder: "Pilates", googleTypes: ["pilates_studio"], nameKeywords: ["pilates"] },
  { id: "plastic_surgery", label: "Plastic surgery", folder: "Plastic Surgery", googleTypes: ["plastic_surgeon"], nameKeywords: ["plastic surg","chirurgie plastique"] },
  { id: "psychiatry", label: "Psychiatry", folder: "Psychiatry", googleTypes: ["psychiatrist"], nameKeywords: ["psychiatr"] },
  { id: "psychology", label: "Psychology", folder: "Psychology", googleTypes: ["psychologist"], nameKeywords: ["psycholog"] },
  { id: "reflexology", label: "Reflexology", folder: "Reflexology", googleTypes: ["reflexologist"], nameKeywords: ["reflexolog","réflexolog"] },
  { id: "social_work", label: "Social work", folder: "Social Work", googleTypes: ["social_worker"] },
  { id: "speech_therapy", label: "Speech therapy", folder: "Speech Therapy", googleTypes: ["speech_pathologist"], nameKeywords: ["speech","orthophon"] },
  { id: "weight_management", label: "Weight management", folder: "Weight Management", googleTypes: ["weight_loss_service"], nameKeywords: ["weight"] },
  { id: "womens_health", label: "Women's health", folder: "Women's Health", googleTypes: ["obstetrician_gynecologist", "womens_health_clinic"], nameKeywords: ["women","gynec","gynéc"] },
  { id: "yoga", label: "Yoga", folder: "Yoga", googleTypes: ["yoga_studio"], nameKeywords: ["yoga"] },
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

/** Disciplines implied by a listing's specific Google types. Generic types say nothing. Common ones first. */
export function disciplinesFromTypes(types: string[]): Discipline[] {
  const set = new Set(types.filter((t) => !GENERIC_TYPES.has(t)));
  return DISCIPLINES.filter((d) => d.googleTypes?.some((t) => set.has(t)))
    .sort((a, b) => Number(!!b.common) - Number(!!a.common))
    .map((d) => d.id as Discipline);
}

/** Disciplines named in a listing's name, in the order they appear ("Dena Sports Physio" → physiotherapy). */
export function disciplinesFromName(name: string): Discipline[] {
  const lower = name.toLowerCase();
  const at = (k: string) => lower.search(new RegExp(`(^|[^\\p{L}])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u"));
  return DISCIPLINES.map((d) => ({ d, at: Math.min(...(d.nameKeywords ?? []).map((k) => (at(k) === -1 ? Infinity : at(k)))) }))
    .filter((x) => x.at !== Infinity)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.d.id as Discipline);
}

/** What a listing most likely offers: what its name says first, then what its specific Google types add. */
export function disciplinesFromListing(name: string, types: string[]): Discipline[] {
  return [...new Set([...disciplinesFromName(name), ...disciplinesFromTypes(types)])];
}

/** True when the listing's Google types match one of the given disciplines. `other` matches anything. */
export function matchesDisciplines(types: string[], disciplines: Discipline[]): boolean {
  if (disciplines.includes("other")) return true;
  const wanted = new Set(disciplines.flatMap((d) => disciplineInfo(d).googleTypes ?? []));
  return types.some((t) => wanted.has(t));
}

/**
 * The one discipline a competitor is counted under: the first of the owner's disciplines it
 * matches, else its own first discipline. Keeps "up to five per discipline" unambiguous.
 */
export function primaryDiscipline(candidateDisciplines: Discipline[], ownerDisciplines: Discipline[]): Discipline {
  return ownerDisciplines.find((d) => candidateDisciplines.includes(d)) ?? candidateDisciplines[0] ?? "other";
}
