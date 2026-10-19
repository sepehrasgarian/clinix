/** Turns internal errors into owner-facing text. Never names a supplier. */
export function humanizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("not set")) return "A required service is not configured on the server.";
  if (lower.includes("not a clinic")) return "This Google listing does not look like a clinic. Confirm it is yours to continue.";
  if (lower.includes("geocod") || lower.includes("address")) return "We could not place your address on the map. Check the street address and city.";
  if (lower.includes("places") || lower.includes("listing")) return "We could not find your clinic's Google listing. Check the clinic name and address.";
  if (lower.includes("declined")) return "We could not analyse this content. Try again or contact support.";
  if (lower.includes("timeout") || lower.includes("timed out")) return "This step took too long. Try again in a minute.";
  return "Something went wrong in this step. You can retry it.";
}
