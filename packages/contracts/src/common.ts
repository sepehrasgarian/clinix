import { z } from "zod";

export { Discipline, DISCIPLINE_LABELS } from "./disciplines";
export type { Discipline as DisciplineId } from "./disciplines";

export const IsoDate = z.string().datetime({ offset: true });
export const Id = z.string().min(1);
