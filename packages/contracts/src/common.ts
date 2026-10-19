import { z } from "zod";

export const Discipline = z.enum([
  "dentistry",
  "dental_hygiene",
  "physiotherapy",
  "chiropractic",
  "massage",
  "naturopathy",
  "other",
]);
export type Discipline = z.infer<typeof Discipline>;

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  dentistry: "Dentistry",
  dental_hygiene: "Dental hygiene",
  physiotherapy: "Physiotherapy",
  chiropractic: "Chiropractic",
  massage: "Massage therapy",
  naturopathy: "Naturopathy",
  other: "Other",
};

export const IsoDate = z.string().datetime({ offset: true });
export const Id = z.string().min(1);
