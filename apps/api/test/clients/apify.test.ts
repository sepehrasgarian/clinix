import { describe, expect, it, vi } from "vitest";
import { ApifyClient, reviewId, toReview } from "../../src/clients/apify.js";

const raw = { placeId: "p1", text: "Great hygienist, gentle and thorough.", stars: 5, publishedAtDate: "2026-09-14T03:12:00.000Z", responseFromOwnerText: "Thank you!", name: "Jane Doe", reviewerUrl: "https://maps.google.com/u/1", reviewerPhotoUrl: "https://lh3.example/photo.jpg" };

describe("toReview", () => {
  it("keeps text, stars, date and the owner reply; drops the reviewer's identity", () => {
    const review = toReview(raw)!;
    expect(review).toMatchObject({ placeId: "p1", rating: 5, text: raw.text, ownerReply: "Thank you!", source: "apify" });
    expect(JSON.stringify(review)).not.toMatch(/Jane|reviewerUrl|photo/);
    expect(review.id).toBe(reviewId("p1", "2026-09-14T03:12:00.000Z", raw.text));
  });
  it("skips reviews without text, stars or a valid date", () => {
    expect(toReview({ ...raw, text: "" })).toBeNull();
    expect(toReview({ ...raw, stars: undefined })).toBeNull();
    expect(toReview({ ...raw, publishedAtDate: "not a date" })).toBeNull();
  });
});

describe("ApifyClient", () => {
  it("posts the place ids with personal data off and maps the dataset", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([raw, { ...raw, text: null }]), { status: 200 }));
    const client = new ApifyClient("tok", fetchImpl as unknown as typeof fetch);
    const reviews = await client.fetchReviews(["p1"], 20);
    expect(reviews).toHaveLength(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("run-sync-get-dataset-items");
    expect(JSON.parse(init.body as string)).toMatchObject({ placeIds: ["p1"], maxReviews: 20, personalData: false });
  });
  it("throws on a failed run and never names the supplier in the message", async () => {
    const client = new ApifyClient("tok", (async () => new Response("", { status: 500 })) as unknown as typeof fetch);
    await expect(client.fetchReviews(["p1"])).rejects.toThrow(/Review fetch failed/);
  });
});
