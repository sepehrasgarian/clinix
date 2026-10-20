import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { guideFolders, type Discipline } from "@clinix/contracts";
import { env, repoRoot } from "../env.js";

/**
 * Discipline reading guides are private configuration, never part of this repository.
 * Sources, in order: a folder on disk (DISCIPLINE_PACKS_DIR), a private GitHub repository
 * (DISCIPLINE_PACKS_REPO + GITHUB_TOKEN), then the bundled general guide. Files are cached
 * in memory and re-read every ten minutes so an edit is live without a restart.
 */
const here = dirname(fileURLToPath(import.meta.url));
const bundled = (name: string) => readFileSync(resolve(here, "text", name), "utf8").trim();

export const REFRESH_MS = 10 * 60 * 1000;
const GUIDE_FILE = /_recommendations\.txt$/;

export type GuideSource = {
  /** Returns the guide text for a folder name, or null when the folder has no guide. */
  read(path: string): Promise<string | null>;
  list(dir: string): Promise<string[]>;
};

export function directorySource(root: string): GuideSource {
  return {
    async read(path) {
      const full = join(root, path);
      return existsSync(full) ? readFileSync(full, "utf8") : null;
    },
    async list(dir) {
      const full = join(root, dir);
      return existsSync(full) ? readdirSync(full) : [];
    },
  };
}

/** Reads a private GitHub repository through the contents API with a read-only token. */
export function githubSource(repo: string, token: string, fetchImpl: typeof fetch = fetch, ref = "main"): GuideSource {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" };
  const url = (path: string) => `https://api.github.com/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${ref}`;
  return {
    async read(path) {
      const res = await fetchImpl(url(path), { headers });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Guide source responded ${res.status}`);
      return res.text();
    },
    async list(dir) {
      const res = await fetchImpl(url(dir), { headers: { ...headers, Accept: "application/vnd.github+json" } });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error(`Guide source responded ${res.status}`);
      const items = (await res.json()) as { name: string }[];
      return items.map((i) => i.name);
    },
  };
}

export class GuideLibrary {
  private cache = new Map<string, { at: number; text: string | null }>();

  constructor(
    private readonly source: GuideSource | null,
    private readonly now: () => number = Date.now,
  ) {}

  /** The reading guide for a discipline: private guide when one exists, else the bundled general one. */
  async guide(discipline: Discipline): Promise<{ text: string; origin: "private" | "general" }> {
    if (this.source) {
      for (const folder of guideFolders(discipline)) {
        const text = await this.cached(`guide:${folder}`, () => this.readGuide(folder));
        if (text) return { text, origin: "private" };
      }
    }
    return { text: bundled("guide_general.txt"), origin: "general" };
  }

  /** A top-level prompt file (e.g. synthesize_system.txt) from the private source, else the bundled one. */
  async prompt(name: string): Promise<string> {
    if (this.source) {
      const text = await this.cached(`prompt:${name}`, () => this.source!.read(name).catch(() => null));
      if (text) return text.trim();
    }
    return bundled(name);
  }

  private async readGuide(folder: string): Promise<string | null> {
    try {
      const files = await this.source!.list(`Disciplines/${folder}`);
      const file = files.find((f) => GUIDE_FILE.test(f));
      if (!file) return null;
      const text = await this.source!.read(`Disciplines/${folder}/${file}`);
      return text?.trim() || null;
    } catch {
      return null; // unreachable source: fall back, never fail a run
    }
  }

  private async cached(key: string, load: () => Promise<string | null>): Promise<string | null> {
    const hit = this.cache.get(key);
    if (hit && this.now() - hit.at < REFRESH_MS) return hit.text;
    const text = await load();
    this.cache.set(key, { at: this.now(), text });
    return text;
  }
}

/** Production wiring from the environment. */
export function buildGuideLibrary(): GuideLibrary {
  if (env.DISCIPLINE_PACKS_DIR) return new GuideLibrary(directorySource(resolve(repoRoot, env.DISCIPLINE_PACKS_DIR)));
  if (env.DISCIPLINE_PACKS_REPO && env.GITHUB_TOKEN) return new GuideLibrary(githubSource(env.DISCIPLINE_PACKS_REPO, env.GITHUB_TOKEN));
  return new GuideLibrary(null);
}
