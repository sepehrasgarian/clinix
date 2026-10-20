import { GuideLibrary } from "../src/prompts/guides.js";

/** A guide library with no private source: every discipline gets the bundled general guide. */
export const testGuides = () => new GuideLibrary(null);
