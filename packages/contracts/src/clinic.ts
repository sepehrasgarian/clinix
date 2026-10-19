import { z } from "zod";
import { Discipline, Id, IsoDate } from "./common.js";

export const ClinicInput = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  province: z.string().length(2).default("ON"),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  disciplines: z.array(Discipline).min(1).max(4),
  services: z.array(z.string()).default([]),
  opened: z.string().regex(/^\d{4}(-\d{2})?$/).optional(),
  notes: z.string().max(2000).optional(),
});
export type ClinicInput = z.infer<typeof ClinicInput>;

export const Clinic = ClinicInput.extend({
  id: Id,
  ownerId: Id,
  orgId: Id.optional(),
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  createdAt: IsoDate,
});
export type Clinic = z.infer<typeof Clinic>;
