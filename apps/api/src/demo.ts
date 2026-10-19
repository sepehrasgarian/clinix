// Quick end-to-end check from the terminal: npm run demo
// Needs ANTHROPIC_API_KEY in apps/api/.env. Uses roughly $0.50-$1.50 of credit per run.
import "dotenv/config";
import { analyzeClinic } from "./agent.js";

const sample = {
  owner_id: "demo",
  name: "North York Family Dental",
  type: "dental clinic",
  address: "77 Finch Ave E",
  city: "Toronto",
  services: ["cleaning", "fillings", "whitening", "Invisalign", "emergency"],
  prices: { cleaning: "$180", whitening: "$450" },
  notes: "Open weekdays 9-5 only. No online booking yet.",
};

const started = Date.now();
const { report, data } = await analyzeClinic(sample);
console.log(report);
console.log("\n==== STRUCTURED ====");
console.log(JSON.stringify(data, null, 2));
console.log(`\nDone in ${Math.round((Date.now() - started) / 1000)}s`);
