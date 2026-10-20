import { AnthropicClient, type AiClient } from "../clients/anthropic.js";
import { ApifyClient, type ReviewSource } from "../clients/apify.js";
import { PlacesClient } from "../clients/places.js";
import { env, requireEnv } from "../env.js";
import { buildGuideLibrary, GuideLibrary } from "../prompts/guides.js";

export type PipelineDeps = {
  places: PlacesClient;
  ai: AiClient;
  reviews: ReviewSource;
  guides: GuideLibrary;
};

/** Without a review-source token the deep stage still runs, on each listing's Google sample reviews. */
const noReviewSource: ReviewSource = {
  async fetchReviews() {
    throw new Error("APIFY_TOKEN is not set");
  },
};

/** Production wiring from the environment. Routes receive this; tests pass fakes instead. */
export function buildDeps(): PipelineDeps {
  return {
    places: new PlacesClient(requireEnv("GOOGLE_PLACES_API_KEY")),
    ai: new AnthropicClient(env.ANTHROPIC_API_KEY),
    reviews: env.APIFY_TOKEN ? new ApifyClient(env.APIFY_TOKEN) : noReviewSource,
    guides: buildGuideLibrary(),
  };
}
