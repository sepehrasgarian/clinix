import { z } from "zod";

/** What a clinic's own website says about it. Read for the owner's clinic and for each competitor. */
export const Understanding = z.object({
  services: z.array(z.string()),
  specializations: z.array(z.string()),
  languages: z.array(z.string()),
  positioning: z.string(),
  nicheTermsByService: z.record(z.string(), z.array(z.string())),
  /** Practitioners the site names, by role. Public professional information only. */
  team: z.array(z.object({ role: z.string(), name: z.string().optional() })).default([]),
  booking: z.object({ online: z.boolean(), phone: z.boolean(), tool: z.string().optional() }).optional(),
  hours: z.string().optional(),
  directBilling: z.boolean().optional(),
  newPatientOffer: z.string().optional(),
  telehealth: z.boolean().optional(),
  /** Parking, wheelchair access, transit, evening or weekend hours, as the site states them. */
  accessibility: z.array(z.string()).default([]),
  locationsCount: z.number().int().nonnegative().optional(),
  pricingShown: z.boolean().optional(),
  socialLinks: z.array(z.string()).default([]),
  /** The most recent dated content found (a blog post, a news item), as a short note. */
  freshness: z.string().optional(),
  /** Awards, years in business, memberships, certifications. */
  trustSignals: z.array(z.string()).default([]),
});
export type Understanding = z.infer<typeof Understanding>;
