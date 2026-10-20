import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const chatSystem = (): string => readFileSync(resolve(here, "text", "chat_system.txt"), "utf8").trim();
