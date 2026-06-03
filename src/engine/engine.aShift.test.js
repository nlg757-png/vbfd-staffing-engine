// ─────────────────────────────────────────────────────────────────────────────
//  Engine validation — A-Shift 04/22/2026 ground truth
//  Sourced from VBFD Staffing Engine Build Specification v1.1.
//
//  Run with:  node src/engine/engine.aShift.test.js
// ─────────────────────────────────────────────────────────────────────────────

import { runEngine, getStats } from "./engine.js";

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else       { fail++; console.log(`  ✗ ${msg}`); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg}  (got: ${JSON.stringify(a)}  expected: ${JSON.stringify(b)})`);
}

// ─── Fixture ────────────────────────────────────────────────────────────────

const vacancies = [
  { id: "E09-CAPT",   unit: "Engine 09",  position: "Fire Captain",     station: 9,  battalion: 2, start: "08:00", end: "08:00", hours: 24, certReq: [],      isUtility: false },
  { id: "E15-FF",     unit: "Engine 15",  position: "Firefighter",      station: 15, battalion: 1, start: "20:00", end: "08:00", hours: 12, certReq: [],      isUtility: false },
  { id: "E05-FF",     unit: "Engine 05",  position: "Firefighter",      station: 5,  battalion: 3, start: "08:00", end: "08:00", hours: 24, certReq: [],      isUtility: false },
  { id: "E17-CAPT",   unit: "Engine 17",  position: "Fire Captain",     station: 17, battalion: 4, start: "08:00", end: "12:00", hours: 4,  certReq: [],      isUtility: false },
  { id: "E17-FF",     unit: "Engine 17",  position: "Firefighter",      station: 17, battalion: 4, start: "08:00", end: "08:00", hours: 24, certReq: [],      isUtility: false },
  { id: "E03-FF-DPO", unit: "Engine 03",  position: "Firefighter DPO",  station: 3,  battalion: 1, start: "17:30", end: "22:30", hours: 5,  certReq: ["DPO"], isUtility: false },
  { id: "L07-FF-TD",  unit: "Ladder 07",  position: "Firefighter TD",   station: 7,  battalion: 4, start: "08:00", end: "18:00", hours: 10, certReq: ["TD"],  isUtility: false },
  { id: "UT1-CAPT",   unit: "Utility 1",  position: "Fire Captain",     station: 16, battalion: 3, start: "08:00", end: "20:00", hours: 12, certReq: [],      isUtility: true  },
  { id: "UT1-FF",     unit: "Utility 1",  position: "Firefighter",      station: 16, battalion: 3, start: "08:00", end: "20:00", hours: 12, certReq: [],      isUtility: true  },
];

// Pre-1200 callback list — order is the spec's CB # ordering.
const callbackPre = [
  { id: "CB1",  listOrder: 1,  name: "Hale, Christina R.",       rank: "FCPT", certs: [],         availStart: "08:00", availEnd: "08:00", availHours: 24, available: true },
  { id: "CB2",  listOrder: 2,  name: "Wilkes, Isiah A.",         rank: "FFII", certs: [],         availStart: "20:00", availEnd: "08:00", availHours: 12, available: true },
  { id: "CB3",  listOrder: 3,  name: "DeGennaro, Filler",        rank: "FFII", certs: [],         availStart: "20:00", availEnd: "08:00", availHours: 12, available: true },
  { id: "CB4",  listOrder: 4,  name: "Strovers, Filler",         rank: "FFII", certs: [],         availStart: "08:00", availEnd: "18:00", availHours: 10, available: true },
  { id: "CB5",  listOrder: 5,  name: "Eason Jr., Patrick S.",    rank: "FFII", certs: [],         availStart: "08:00", availEnd: "08:00", availHours: 24, available: true },
  { id: "CB6",  listOrder: 6,  name: "Irving, Richard E.",       rank: "FCPT", certs: [],         availStart: "08:00", availEnd: "12:00", availHours: 4,  available: true },
  { id: "CB7",  listOrder: 7,  name: "Sidwell, Brandon R.",      rank: "FCPT", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB8",  listOrder: 8,  name: "Noaksson, Erik T.",        rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB9",  listOrder: 9,  name: "Hewitt, Filler",           rank: "FCPT", certs: [],         availStart: "18:00", availEnd: "08:00", availHours: 14, available: true },
  { id: "CB10", listOrder: 10, name: "Gaspar, Matthew J.",       rank: "FFII", certs: [],         availStart: "08:00", availEnd: "08:00", availHours: 24, available: true },
  { id: "CB11", listOrder: 11, name: "Filler 11",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB12", listOrder: 12, name: "Filler 12",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB13", listOrder: 13, name: "Filler 13",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB14", listOrder: 14, name: "Filler 14",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB15", listOrder: 15, name: "Ranay, Filler",            rank: "FFII", certs: [],         availStart: "08:00", availEnd: "08:00", availHours: 24, available: true },
  { id: "CB16", listOrder: 16, name: "Mezzapeso, Filler",        rank: "FFII", certs: [],         availStart: "08:00", availEnd: "08:00", availHours: 24, available: true },
  { id: "CB17", listOrder: 17, name: "Filler 17",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB18", listOrder: 18, name: "Filler 18",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB19", listOrder: 19, name: "Filler 19",                rank: "FFII", certs: [],         availStart: "08:00", availEnd: "20:00", availHours: 12, available: true },
  { id: "CB20", listOrder: 20, name: "Kornegay, Caleb J.",       rank: "FFII", certs: ["DPO"],    availStart: "17:30", availEnd: "22:30", availHours: 5,  available: true },
];

const callbackPost = [];

// MHO list — only entry that matters for outcome is #6 Grandison (TD).
// Members 1-5 lack TD cert so they cannot fill Ladder 07.
const mho = [
  { id: "M1",  listOrder: 1,  name: "MHO Filler 1", rank: "FFII",  certs: [],     available: true },
  { id: "M2",  listOrder: 2,  name: "MHO Filler 2", rank: "FFII",  certs: [],     available: true },
  { id: "M3",  listOrder: 3,  name: "MHO Filler 3", rank: "FFII",  certs: [],     available: true },
  { id: "M4",  listOrder: 4,  name: "MHO Filler 4", rank: "FFII",  certs: [],     available: true },
  { id: "M5",  listOrder: 5,  name: "MHO Filler 5", rank: "FFII",  certs: [],     available: true },
  { id: "M6",  listOrder: 6,  name: "Grandison III, Joseph L.", rank: "MFFII", certs: ["TD"], available: true },
];

// ─── Run ────────────────────────────────────────────────────────────────────

console.log("\n── A-Shift 04/22/2026 ground truth (spec v1.1) ──────────────\n");

const result = runEngine({
  vacancies,
  unassigned: [],
  callbackPre,
  callbackPost,
  mho,
});

const byVac = new Map(result.assignments.map((a) => [a.vacancyId, a]));

function pickByUnit(unit) {
  return result.assignments.find(
    (a) => a.vacancy?.unit === unit && a.status !== "unstaffed"
  );
}

// Engine 09 Captain → Hale (CB #1)
const e09 = byVac.get("E09-CAPT");
assert(!!e09, "E09 Capt assignment exists");
eq(e09?.personName, "Hale, Christina R.", "E09 Capt → Hale");
eq(e09?.rank, "FCPT",                     "E09 Capt rank FCPT");
eq(e09?.acting, false,                    "E09 Capt not acting");

// Engine 15 FF → Wilkes (CB #2)
const e15 = byVac.get("E15-FF");
eq(e15?.personName, "Wilkes, Isiah A.", "E15 FF → Wilkes");
eq(e15?.rank, "FFII",                    "E15 FF rank FFII");

// Engine 05 FF → Eason (CB #5)
const e05 = byVac.get("E05-FF");
eq(e05?.personName, "Eason Jr., Patrick S.", "E05 FF → Eason");

// Engine 17 Capt → Irving (CB #6)
const e17c = byVac.get("E17-CAPT");
eq(e17c?.personName, "Irving, Richard E.", "E17 Capt → Irving");
eq(e17c?.rank, "FCPT",                      "E17 Capt rank FCPT");

// Engine 17 FF → Gaspar (CB #10)
const e17f = byVac.get("E17-FF");
eq(e17f?.personName, "Gaspar, Matthew J.", "E17 FF → Gaspar");

// Engine 03 FF DPO → Kornegay (CB #20)
const e03 = byVac.get("E03-FF-DPO");
eq(e03?.personName, "Kornegay, Caleb J.", "E03 FF DPO → Kornegay");

// Ladder 07 TD → Grandison via MHO #6
const l07 = byVac.get("L07-FF-TD");
eq(l07?.personName, "Grandison III, Joseph L.", "L07 TD → Grandison (MHO)");
eq(l07?.tier, "MHO",                              "L07 from MHO");

// Utility 1 Captain → Sidwell (CB #7)
const ut1c = byVac.get("UT1-CAPT");
eq(ut1c?.personName, "Sidwell, Brandon R.", "UT1 Capt → Sidwell");

// Utility 1 FF → Noaksson (CB #8)
const ut1f = byVac.get("UT1-FF");
eq(ut1f?.personName, "Noaksson, Erik T.", "UT1 FF → Noaksson");

// Stats sanity
const stats = getStats(result.assignments);
console.log("\nStats:", stats);
eq(stats.unstaffed, 0, "0 unstaffed (all 9 filled)");
eq(stats.mhoUsed,   1, "1 MHO used (Grandison → L07)");
eq(stats.actingCapt, 0, "0 acting captains (all true FCPT)");

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFull assignments dump:");
  for (const a of result.assignments) {
    console.log(`  ${(a.vacancyId || "").padEnd(14)} ${(a.personName || "—").padEnd(28)} ${(a.rank || "-").padEnd(6)} ${(a.tier || "").padEnd(12)} ${a.acting ? "[ACTING]" : ""} ${a.status}`);
  }
  process.exit(1);
}
