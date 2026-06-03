// ─────────────────────────────────────────────────────────────────────────────
//  Flags engine — produces officer-resolution items for the Flags tab.
//  Every flag has: { id, severity, title, body, vacancyId? }.
// ─────────────────────────────────────────────────────────────────────────────

import {
  BATTALION_CAPTAIN_MINIMUMS,
  SPECIALTY_MINIMUMS,
  SEASONAL_RULES,
  isSeasonalActive,
  stationDistanceMiles,
} from "./constants.js";

const SEV = { HIGH: "HIGH", MEDIUM: "MEDIUM", LOW: "LOW" };

export function buildFlags({ assignments, input, fullRosterAvailable = false }) {
  const flags = [];
  let id = 1;
  const push = (severity, title, body, extra = {}) =>
    flags.push({ id: `F${id++}`, severity, title, body, ...extra });

  // ── Acting Captain ──────────────────────────────────────────────────────
  for (const a of assignments) {
    if (a.acting) {
      push(SEV.MEDIUM,
        "Acting Captain Assignment",
        `${a.personName} (${a.rank}) is filling ${a.vacancy?.unit || "a captain slot"} as Acting Captain. Treat as a captain-role assignment; verify it is logged correctly on the staffing sheet.`,
        { vacancyId: a.vacancyId });
    }
  }

  // ── Battalion Captain Minimums ──────────────────────────────────────────
  // Count true FCPTs per battalion AFTER assignments.  Acting captains do
  // NOT count.  A vacant captain seat that gets a true FCPT assigned counts;
  // a vacant seat filled by an acting MFFII/FMFF, or left UNSTAFFED, does not.
  const seats = input.captainSeats || [];
  if (seats.length > 0) {
    // Index assignments by vacancyId for quick lookup of post-engine state.
    const filledByUnit = new Map();   // `${battalion}|${unit}` → true FCPT count delta
    for (const a of assignments) {
      if (a.status === "unstaffed") continue;
      const v = a.vacancy;
      if (!v) continue;
      // We only care about captain vacancies for this count.
      const isCapt = /captain/i.test(v.position || "");
      if (!isCapt) continue;
      const key = `${v.battalion ?? "?"}|${v.unit ?? "?"}`;
      // Captain-role coverage includes true FCPTs and members assigned as
      // Acting Captain in a captain slot.
      const trueFcpt = a.rank === "FCPT" || a.acting;
      filledByUnit.set(key, trueFcpt ? 1 : 0);
    }

    // Per-battalion tally
    const byBat = {};
    for (const s of seats) {
      const bat = s.battalion;
      if (!bat) continue;
      if (!byBat[bat]) byBat[bat] = { trueFCPT: 0, total: 0, acting: 0, vacant: 0 };
      byBat[bat].total++;
      // If this seat became a vacancy, look up the assignment outcome.
      // (Vacancy seats appear in `seats` with filled=false.)
      if (!s.filled) {
        const key = `${s.battalion}|${s.unit}`;
        if (filledByUnit.has(key)) {
          if (filledByUnit.get(key) === 1) byBat[bat].trueFCPT++;
          else byBat[bat].acting++;
        } else {
          byBat[bat].vacant++;
        }
      } else if (s.trueFCPT) {
        byBat[bat].trueFCPT++;
      } else {
        // Filled seat, but rostered occupant is not an FCPT (e.g. ACTNG).
        byBat[bat].acting++;
      }
    }

    let anyChecked = false;
    for (const [batStr, counts] of Object.entries(byBat)) {
      const bat = Number(batStr);
      const min = BATTALION_CAPTAIN_MINIMUMS[bat];
      if (min == null) continue;
      anyChecked = true;
      if (counts.trueFCPT < min) {
        push(SEV.HIGH,
          `Battalion ${bat} Below Captain Minimum`,
          `Battalion ${bat} has ${counts.trueFCPT} captain-role member${counts.trueFCPT === 1 ? "" : "s"} after assignments (minimum ${min}). Acting Captains are counted as captain-role coverage.`);
      }
    }
    if (!anyChecked) {
      push(SEV.LOW,
        "Battalion Captain Census Empty",
        "No captain seats detected in the roster export. Confirm minimums externally.");
    }
  } else if (fullRosterAvailable) {
    push(SEV.LOW,
      "Battalion Captain Minimum Verification",
      "Full-roster context required to verify battalion captain counts. Confirm minimums externally.");
  } else {
    push(SEV.LOW,
      "Captain Minimum Verification Pending",
      `Roster export does not include captain-seat metadata. Verify battalion minimums externally (Bat 1/2/3: ${BATTALION_CAPTAIN_MINIMUMS[1]} · Bat 4/5: ${BATTALION_CAPTAIN_MINIMUMS[4]}).`);
  }

  // ── MANDO dual-list credit ──────────────────────────────────────────────
  // Member is on BOTH callback and MHO lists.  When consumed via callback,
  // MHO obligation is satisfied for the day.
  const mhoNames = new Set(
    (input.mho || []).map((m) => String(m.name || "").toLowerCase())
  );
  for (const a of assignments) {
    if (
      a.tier === "CALLBACK" &&
      a.personName &&
      mhoNames.has(String(a.personName).toLowerCase())
    ) {
      push(SEV.LOW,
        "MANDO Dual-List Credit",
        `${a.personName} is on both Callback and MHO lists. Callback assignment to ${a.vacancy?.unit || "—"} satisfies MHO obligation for the day.`,
        { vacancyId: a.vacancyId });
    }
  }

  // ── MU·P ────────────────────────────────────────────────────────────────
  for (const m of input.muP || []) {
    push(SEV.HIGH,
      "MU·P Member Detected",
      `${m.name} (${m.rank || "—"}) flagged MU·P at Station ${m.station ?? "—"} ${m.unit || ""}. May create a hidden vacancy.`);
  }

  // ── Unconfirmed status codes ────────────────────────────────────────────
  for (const u of input.unconfirmed || []) {
    push(SEV.MEDIUM,
      `Unconfirmed Status: ${u.statusCode}`,
      `${u.name} (${u.rank || "—"}) at Station ${u.station ?? "—"}. Requires officer confirmation before finalizing staffing.`);
  }

  // ── Specialty cert minimums ─────────────────────────────────────────────
  // Count members per (station, cert) from the in-house roster.  Filled
  // vacancies from the engine output are also added so today's recommended
  // assignments are counted.  If we don't have an in-house census, fall back
  // to LOW advisory flags.
  const inHouse = input.inHouseMembers || [];
  if (inHouse.length === 0) {
    for (const sp of SPECIALTY_MINIMUMS) {
      if (!isSeasonalActive(sp.seasonal)) continue;
      push(SEV.LOW,
        `Specialty Min: ${sp.cert} @ Station ${sp.station}`,
        `${sp.note} — in-house census unavailable; verify externally.`);
    }
  } else {
    // Build (station,cert) → count from the in-house roster.
    const counts = new Map();          // key: `${station}|${cert}` → integer
    const bump = (station, cert) => {
      const k = `${station}|${cert}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    };
    for (const m of inHouse) {
      for (const c of m.certs || []) {
        bump(m.station, String(c).toUpperCase());
      }
    }
    // Add today's engine assignments — they bring their certs to the station.
    for (const a of assignments) {
      if (a.status === "unstaffed") continue;
      const sta = a.vacancy?.station;
      if (sta == null) continue;
      for (const c of a.certs || []) {
        bump(sta, String(c).toUpperCase());
      }
    }
    for (const sp of SPECIALTY_MINIMUMS) {
      if (!isSeasonalActive(sp.seasonal)) continue;
      const have = counts.get(`${sp.station}|${sp.cert.toUpperCase()}`) || 0;
      if (have >= sp.count) continue;
      push(SEV.MEDIUM,
        `Specialty Min Below Threshold: ${sp.cert} @ Sta ${sp.station}`,
        `${sp.note}. Have ${have}, need ${sp.count}.`);
    }
  }

  // ── 12-hr split notice ──────────────────────────────────────────────────
  const splits = assignments.filter((a) => a.vacancy?.splitOf);
  if (splits.length > 0) {
    const units = [...new Set(splits.map((a) => a.vacancy.splitOf))];
    push(SEV.MEDIUM,
      "12-Hour MHO Max Rule Applied",
      `Split into Day/Night halves: ${units.join(", ")}.`);
  }

  // ── Unstaffed Utility 1 ─────────────────────────────────────────────────
  for (const a of assignments) {
    if (a.status === "unstaffed" && a.vacancy?.isUtility) {
      push(SEV.HIGH,
        "Utility 1 Unstaffed",
        "Callback empty or exhausted; MHO and MHE prohibited for Utility 1 by Section 9.",
        { vacancyId: a.vacancyId });
    }
  }

  // ── Proximity / long-travel advisory ─────────────────────────────────────
  // Spec: proximity is a TIEBREAKER ONLY — never overrides higher list order.
  // We surface a LOW advisory flag when an assigned member's
  // current/home station is far from the vacancy station, to give the
  // staffing officer visibility on travel impact.  ~15 miles in VBFD's
  // coverage area is a meaningful drive across the city.
  const LONG_TRAVEL_THRESHOLD_MI = 15;
  for (const a of assignments) {
    if (a.status === "unstaffed") continue;
    const vacSta = a.vacancy?.station;
    const personSta = a.currentStation ?? a.homeStation;
    const stationKind = a.currentStation != null ? "current station" : "home station";
    if (vacSta == null || personSta == null) continue;
    const miles = stationDistanceMiles(personSta, vacSta);
    if (miles == null || miles < LONG_TRAVEL_THRESHOLD_MI) continue;
    push(SEV.LOW,
      "Long Travel Distance",
      `${a.personName} → Sta ${vacSta} is ~${miles.toFixed(1)} mi from their ${stationKind} (Sta ${personSta}). Confirm response time.`,
      { vacancyId: a.vacancyId });
  }

  // ── Seasonal operational rules (advisory) ───────────────────────────────
  const shiftDateStr = input?.shiftMeta?.shiftDate;
  let shiftDate = null;
  if (shiftDateStr) {
    const m = String(shiftDateStr).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) {
      const [, mo, da, yr] = m;
      shiftDate = new Date(
        yr.length === 2 ? 2000 + Number(yr) : Number(yr),
        Number(mo) - 1,
        Number(da)
      );
    }
  }
  if (!shiftDate || isNaN(shiftDate.getTime())) shiftDate = new Date();
  for (const rule of SEASONAL_RULES) {
    if (!isSeasonalActive(rule.window, shiftDate)) continue;
    push(SEV.LOW, rule.title, rule.body);
  }

  // ── Always-on fatigue review notice ─────────────────────────────────────
  push(SEV.LOW,
    "Fatigue Review",
    "Prior 72-hour work history is not available in this session. Confirm no member exceeds fatigue thresholds.");

  return flags;
}

export function highCount(flags) {
  return flags.filter((f) => f.severity === "HIGH").length;
}
