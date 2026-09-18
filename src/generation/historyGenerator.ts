import type { RNG } from "../world/prng";
import type { HistoryEvent, BuildingUsage } from "../types";

const RENOVATION_NOTES = [
  "Renovated",
  "Facade restored",
  "Interior remodeled",
  "Structural reinforcement work",
  "Windows and roofing replaced",
];

const INCIDENT_NOTES = [
  "Minor fire damage, later repaired",
  "Storm damage to the roof",
  "Partially condemned, then reopened after repairs",
  "Flooding in the lower level",
];

const OWNERSHIP_NOTES = [
  "Changed ownership",
  "Sold to a new operator",
  "Taken over by the district authority",
];

/**
 * Generates a plausible (fictional) history timeline for a single building,
 * seeded deterministically so the same world always produces the same
 * history for the same building id.
 */
export function generateBuildingHistory(
  rng: RNG,
  builtYear: number,
  currentYear: number,
  usage: BuildingUsage
): HistoryEvent[] {
  const events: HistoryEvent[] = [
    { year: builtYear, text: `Constructed as ${usage.label.toLowerCase()}` },
  ];

  let year = builtYear + rng.int(6, 18);
  while (year < currentYear) {
    const roll = rng.next();
    if (roll < 0.45) {
      events.push({ year, text: rng.pick(RENOVATION_NOTES) });
    } else if (roll < 0.7) {
      events.push({ year, text: rng.pick(OWNERSHIP_NOTES) });
    } else if (roll < 0.85 && usage.kind !== "civic") {
      events.push({ year, text: `Converted to ${rng.pick(["office", "residential", "retail", "mixed-use"])} use` });
    } else {
      events.push({ year, text: rng.pick(INCIDENT_NOTES) });
    }
    year += rng.int(7, 22);
  }

  events.push({ year: currentYear, text: "Current state" });
  return events;
}

const CITY_MILESTONES = [
  "First rail line connected to the city",
  "Population crossed a major threshold",
  "A new district broke ground",
  "Major flooding reshaped the riverfront",
  "An economic boom drew new industry",
  "A period of economic decline",
  "The old quarter was declared a heritage zone",
  "A new civic center opened",
  "A large fire reshaped several blocks",
  "The transit network was expanded",
];

export function generateCityHistory(
  rng: RNG,
  foundedYear: number,
  currentYear: number
): HistoryEvent[] {
  const events: HistoryEvent[] = [{ year: foundedYear, text: "City founded" }];
  let year = foundedYear + rng.int(10, 30);
  const used = new Set<string>();
  while (year < currentYear) {
    let note = rng.pick(CITY_MILESTONES);
    let guard = 0;
    while (used.has(note) && guard < 5) {
      note = rng.pick(CITY_MILESTONES);
      guard++;
    }
    used.add(note);
    events.push({ year, text: note });
    year += rng.int(12, 34);
  }
  return events;
}
