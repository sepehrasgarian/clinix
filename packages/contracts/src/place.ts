import { z } from "zod";
import { Id, IsoDate } from "./common";

/** A review with reviewer identity removed at ingest. */
export const Review = z.object({
  id: Id,
  placeId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  publishedAt: IsoDate,
  ownerReply: z.string().optional(),
  source: z.enum(["places", "apify"]),
});
export type Review = z.infer<typeof Review>;

export const Place = z.object({
  placeId: z.string(),
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  types: z.array(z.string()).default([]),
  hours: z.array(z.string()).optional(),
  /** Google photo resource name; fetch it through the API's photo proxy, never with the key in the browser. */
  photoName: z.string().optional(),
  sampleReviews: z.array(Review).default([]),
});
export type Place = z.infer<typeof Place>;
