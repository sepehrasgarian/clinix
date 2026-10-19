import { AnthropicClient, type AiClient } from "../clients/anthropic.js";
import { PlacesClient } from "../clients/places.js";
import { env, requireEnv } from "../env.js";

export type PipelineDeps = {
  places: PlacesClient;
  ai: AiClient;
};

/** Production wiring from the environment. Routes receive this; tests pass fakes instead. */
export function buildDeps(): PipelineDeps {
  return {
    places: new PlacesClient(requireEnv("GOOGLE_PLACES_API_KEY")),
    ai: new AnthropicClient(env.ANTHROPIC_API_KEY),
  };
}
