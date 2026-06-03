// ─────────────────────────────────────────────────────────────────────────────
//  Engine validation — B-Shift 04/24/2026 ground truth
//  Run with:  npx tsx src/engine/engine.test.js   (or node, given ESM)
// ─────────────────────────────────────────────────────────────────────────────

import { runEngine, getStats } from "./engine.js";

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else       { fail++; console.log(`  ✗ ${msg}`); }
}
function eq(a, b, msg) { assert(a === b, `${msg}  (got: ${JSON.stringify(a)}  expected: ${JSON.stringify(b)})`); }

// ─── Fixture ────────────────────────────────────────────────────────────────

const vacancies = [
  { id: "L11-CAPT",  unit: "Ladder 11",  position: "Captain",      station: 11, start: "08:00", end: "08:00", hours: 24, certReq: [] },
  { id: "E06-CAPT",  unit: "Engine 06",  position: "Captain",      station: 6,  start: "08:00", end: "08:00", hours: 24, certReq: [] },
  { id: "E13-CAPT-N",unit: "Engine 13",  position: "Captain",      station: 13, start: "20:00", end: "08:00", hours: 12, certReq: [] },
  { id: "E17-FF",    unit: "Engine 17",  position: "Firefighter",  station: 17, start: "08:00", end: "18:00", hours: 10, certReq: [] },
  { id: "UT1-CAPT",  unit: "Utility 1",  position: "Captain",      station: null,start:"08:00", end: "08:00", hours: 24, certReq: [], isUtility: true },
  { id: "UT1-FF",    unit: "Utility 1",  position: "Firefighter",  station: null,start:"08:00", end: "08:00", hours: 24, certReq: [], isUtility: true },
];

const unassigned = [
  { id: "P-ROJAS", name: "Rojas, Brandon", rank: "FFII", certs: [],
    availStart: "08:00", availEnd: "18:00", homeStation: 17, currentStation: 17 },
];

const mho = [
  { id: "M01", name: "Harris, Nicholas W.",  rank: "MFFII", certs: [], listOrder: 1  },
  { id: "M02", name: "Libby, Gary K.",        rank: "FCPT",  certs: [], listOrder: 2  },
  { id: "M03", name: "McCullen, Christian D.",rank: "MFFII", certs: [], listOrder: 3  },
  { id: "M04", name: "Milliner, Bradford C.", rank: "FMFF",  certs: [], listOrder: 4  },
  { id: "M05", name: "Filler A",              rank: "FFII",  certs: [], listOrder: 5  },
  { id: "M06", name: "Filler B",              rank: "FFII",  certs: [], listOrder: 6  },
  { id: "M07", name: "Filler C",              rank: "FFII",  certs: [], listOrder: 7  },
  { id: "M08", name: "Filler D",              rank: "FFII",  certs: [], listOrder: 8  },
  { id: "M09", name: "Filler E",              rank: "FFII",  certs: [], listOrder: 9  },
  { id: "M10", name: "Filler F",              rank: "FFII",  certs: [], listOrder: 10 },
  { id: "M11", name: "Filler G",              rank: "FFII",  certs: [], listOrder: 11 },
  { id: "M12", name: "Filler H",              rank: "FFII",  certs: [], listOrder: 12 },
  { id: "M13", name: "Filler I",              rank: "FFII",  certs: [], listOrder: 13 },
  { id: "M14", name: "Filler J",              rank: "FFII",  certs: [], listOrder: 14 },
  { id: "M15", name: "Hewitt Jr, David L.",   rank: "FCPT",  certs: [], listOrder: 15 },
];

// Empty callback lists (this is the point — UT-1 must stay unstaffed).
const callbackPre = [];
const callbackPost = [];

// ─── Run ────────────────────────────────────────────────────────────────────

console.log("\n── B-Shift 04/24/2026 ground truth ──────────────────────────\n");

const result = runEngine({ vacancies, unassigned, callbackPre, callbackPost, mho });
const byVac = new Map(result.assignments.map((a) => [a.vacancyId, a]));

function findBySplit(baseId, half) {
  return result.assignments.find(
    (a) => a.vacancyId === `${baseId}-${half}` ||
           (a.vacancy?.splitOf && a.vacancy.half === (half === "D" ? "DAY" : "NIGHT")
            && a.vacancy.id.startsWith(baseId))
  );
}

// L11 Day → Libby FCPT
const l11d = findBySplit("L11-CAPT", "D");
assert(!!l11d, "L11 Day assignment exists");
eq(l11d?.personName, "Libby, Gary K.", "L11 Day → Libby");
eq(l11d?.rank, "FCPT",                  "L11 Day rank FCPT");
eq(l11d?.acting, false,                 "L11 Day not acting");

// L11 Night → Harris MFFII [Acting]
const l11n = findBySplit("L11-CAPT", "N");
assert(!!l11n, "L11 Night assignment exists");
eq(l11n?.personName, "Harris, Nicholas W.", "L11 Night → Harris");
eq(l11n?.rank, "MFFII",                      "L11 Night rank MFFII");
eq(l11n?.acting, true,                       "L11 Night acting");

// E06 Day → Hewitt FCPT
const e06d = findBySplit("E06-CAPT", "D");
assert(!!e06d, "E06 Day assignment exists");
eq(e06d?.personName, "Hewitt Jr, David L.", "E06 Day → Hewitt");
eq(e06d?.rank, "FCPT",                       "E06 Day rank FCPT");
eq(e06d?.acting, false,                      "E06 Day not acting");

// E06 Night → McCullen MFFII [Acting]
const e06n = findBySplit("E06-CAPT", "N");
assert(!!e06n, "E06 Night assignment exists");
eq(e06n?.personName, "McCullen, Christian D.", "E06 Night → McCullen");
eq(e06n?.rank, "MFFII",                         "E06 Night rank MFFII");
eq(e06n?.acting, true,                          "E06 Night acting");

// E13 Night → Milliner FMFF [Acting]
const e13n = byVac.get("E13-CAPT-N");
assert(!!e13n, "E13 Night assignment exists");
eq(e13n?.personName, "Milliner, Bradford C.", "E13 Night → Milliner");
eq(e13n?.rank, "FMFF",                         "E13 Night rank FMFF");
eq(e13n?.acting, true,                         "E13 Night acting");

// E17 FF → Rojas from Tier 1 Unassigned
const e17 = byVac.get("E17-FF");
assert(!!e17, "E17 assignment exists");
eq(e17?.personName, "Rojas, Brandon", "E17 → Rojas");
eq(e17?.tier, "UNASSIGNED",           "E17 from Tier 1 Unassigned");
eq(e17?.acting, false,                "E17 not acting");

// UT-1 Captain → UNSTAFFED (callback empty; MHO prohibited for utility)
const ut1c = byVac.get("UT1-CAPT");
assert(!!ut1c, "UT-1 Captain record exists");
eq(ut1c?.status, "unstaffed", "UT-1 Captain unstaffed");

// UT-1 Firefighter → UNSTAFFED
const ut1f = byVac.get("UT1-FF");
assert(!!ut1f, "UT-1 Firefighter record exists");
eq(ut1f?.status, "unstaffed", "UT-1 Firefighter unstaffed");

// Stats sanity
const stats = getStats(result.assignments);
console.log("\nStats:", stats);
eq(stats.mhoUsed, 5,    "5 MHO used");
eq(stats.actingCapt, 3, "3 acting captains");
eq(stats.unstaffed, 2,  "2 unstaffed (both UT-1)");

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFull assignments dump:");
  for (const a of result.assignments) {
    console.log(`  ${a.vacancyId.padEnd(14)} ${(a.personName || "—").padEnd(28)} ${(a.rank || "-").padEnd(6)} ${a.tier.padEnd(12)} ${a.acting ? "[ACTING]" : ""} ${a.status}`);
  }
  process.exit(1);
}
