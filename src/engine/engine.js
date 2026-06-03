// ─────────────────────────────────────────────────────────────────────────────
//  VBFD Staffing Assignment Engine — core algorithm (v1.0)
//  Implements the rules defined in the VBFD Staffing Engine Build Prompt v1.0.
// ─────────────────────────────────────────────────────────────────────────────

import {
  RANK_GROUP,
  CAN_FILL_CAPTAIN,
  CAN_FILL_FF,
  MHO_MAX_HOURS,
  PARTIAL_COVERAGE_THRESHOLD,
  EXCUSED_CODES,
  stationDistanceMiles,
} from "./constants.js";
import {
  toMinutes,
  windowHours,
  overlapMinutes,
  fullyCovers,
  coverageFraction,
} from "./time.js";

// ─── Callback priority sort (spec § "Callback List Priority Factors") ──────
//   1. 24-hour availability for 24-hour vacancies (members with uninterrupted
//      24hr availability walk first so they naturally grab 24hr vacancies)
//   2. Last date used — oldest = highest priority
//   3. Total hours since Jan 1 — fewer = higher
//   4. Alphabetical by last name — final tiebreaker
//
//   Rank-match (factor 1 in the spec) is already enforced by `rankEligible`,
//   so it is not part of this sort.
//
//   IMPORTANT: this sort is only meaningful when the upstream parser has
//   enriched `lastUsed` / `totalHours` from the "Callback List as Pulled"
//   sheet.  If no member in the pool has either field, we preserve the
//   incoming `listOrder` (the manually curated CBMHO order) — this also
//   keeps the existing B-Shift test fixture behavior intact.
function parseLastUsed(s) {
  if (!s) return Infinity;          // missing date → lowest priority
  const m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return Infinity;
  const [, mo, da, yr] = m;
  const year = yr.length === 2 ? 2000 + Number(yr) : Number(yr);
  return new Date(year, Number(mo) - 1, Number(da)).getTime();
}
function lastNameKey(name) {
  return String(name || "").split(",")[0].trim().toLowerCase();
}
export function prioritySortPool(pool) {
  // Daily CBMHO visible list order is authoritative.
  // Do not reorder people by station location, home station, missing priority
  // data, or apparatus familiarity. Those are officer-facing context items,
  // not reasons to jump a lower-listed member ahead.
  return [...pool].sort(
    (a, b) => (a.listOrder ?? 1e9) - (b.listOrder ?? 1e9)
  );
}

// Current-station and apparatus-experience preference helpers.
// Current location wins first because it is where the member physically is now.
// Home station is a secondary familiarity fallback. After location, use
// apparatus experience: LA/LO for ladders and RSQ for rescue vacancies.
function stablePersonKey(person) {
  const order = String(person.listOrder ?? 999999).padStart(6, "0");
  return `${order}|${String(person.name || "").toLowerCase()}|${person.id || ""}`;
}

function hasCert(person, code) {
  return (person.certs || []).some((c) => String(c).toUpperCase() === code);
}

function hasAnyCert(person, codes) {
  return (codes || []).some((code) => hasCert(person, code));
}

function specialtyCertsForStation(station) {
  const map = {
    1: ["MO1", "MC", "FRS"],
    3: ["HZM"],
    6: ["MO6", "MC"],
    7: ["TECH"],
    11: ["FRS"],
    12: ["MO12", "MC"],
    15: ["FRS"],
    17: ["FRS"],
  };
  return map[station] || [];
}

function specialtyNeededForVacancy(input, vacancy) {
  const shortfalls = input?.specialtyShortfalls || {};
  const station = vacancy?.station;
  if (!station) return [];
  const keys = [
    `station-${station}-marine`,
    `station-${station}-hazmat`,
    `station-${station}-tech`,
    `station-${station}-frs`,
  ];
  return keys.some((k) => shortfalls[k]) ? specialtyCertsForStation(station) : [];
}

function isLadderVacancy(vacancy) {
  const s = `${vacancy?.unit || ""} ${vacancy?.position || ""}`.toUpperCase();
  return /\bLADDER\b|\bL-?\d+\b|\bTILLER\b|\bTOWER\b/.test(s);
}

function isRescueVacancy(vacancy) {
  const s = `${vacancy?.unit || ""} ${vacancy?.position || ""}`.toUpperCase();
  return /\bRESCUE\b|\bFR\s*\d+\b|\bFR-?\d+\b/.test(s);
}

function apparatusExperienceScore(person, vacancy) {
  if (isLadderVacancy(vacancy)) {
    return hasCert(person, "LO") || hasCert(person, "LA") ? 0 : 1;
  }
  if (isRescueVacancy(vacancy)) {
    return hasCert(person, "RSQ") ? 0 : 1;
  }
  return 0;
}

function stationPreference(person, vacancy) {
  const vacSta = vacancy?.station;
  const currentSta = person.currentStation ?? null;
  const homeSta = person.homeStation ?? null;
  const currentMiles = currentSta != null && vacSta != null
    ? stationDistanceMiles(currentSta, vacSta)
    : null;
  const homeMiles = homeSta != null && vacSta != null
    ? stationDistanceMiles(homeSta, vacSta)
    : null;
  return {
    currentMiles: currentMiles ?? Infinity,
    homeMiles: homeMiles ?? Infinity,
    currentSta,
    homeSta,
  };
}

function comparePeopleForVacancy(a, b, vacancy) {
  const A = stationPreference(a, vacancy);
  const B = stationPreference(b, vacancy);
  if (A.currentMiles !== B.currentMiles) return A.currentMiles - B.currentMiles;
  if (A.homeMiles !== B.homeMiles) return A.homeMiles - B.homeMiles;

  const ax = apparatusExperienceScore(a, vacancy);
  const bx = apparatusExperienceScore(b, vacancy);
  if (ax !== bx) return ax - bx;

  const ak = stablePersonKey(a), bk = stablePersonKey(b);
  return ak < bk ? -1 : ak > bk ? 1 : 0;
}

function proximityValue(person, vacancy) {
  const target = Number(vacancy?.station);
  if (!target) return { tier: 9, miles: Infinity, listOrder: person.listOrder ?? 1e9 };

  const current = person.currentStation ?? null;
  const home = person.homeStation ?? null;

  if (current === target) return { tier: 0, miles: 0, listOrder: person.listOrder ?? 1e9 };
  if (home === target) return { tier: 1, miles: 0, listOrder: person.listOrder ?? 1e9 };

  const station = current ?? home;
  const miles = station != null ? stationDistanceMiles(station, target) : null;
  return { tier: 2, miles: miles ?? Infinity, listOrder: person.listOrder ?? 1e9 };
}

function sourceStation(person) {
  return person.currentStation ?? person.homeStation ?? null;
}

function estimatedTravelMinutes(person, vacancy) {
  const station = sourceStation(person);
  const target = Number(vacancy?.station);
  if (!station || !target) return Infinity;
  const miles = stationDistanceMiles(station, target);
  if (miles == null) return Infinity;
  return miles * 2;
}

function proximityMayOverrideList(closerPerson, listPerson, vacancy) {
  if (!closerPerson || !listPerson) return false;
  if ((closerPerson.source || "") !== (listPerson.source || "")) return false;
  if (!["CB", "MHO"].includes(closerPerson.source)) return false;

  const closerMinutes = estimatedTravelMinutes(closerPerson, vacancy);
  const listMinutes = estimatedTravelMinutes(listPerson, vacancy);
  return Number.isFinite(closerMinutes) &&
         Number.isFinite(listMinutes) &&
         listMinutes - closerMinutes >= 120;
}

function compareByProximityThenList(a, b, vacancy) {
  const listDelta = (a.listOrder ?? 1e9) - (b.listOrder ?? 1e9);
  if (listDelta === 0) return estimatedTravelMinutes(a, vacancy) - estimatedTravelMinutes(b, vacancy);

  const listPerson = listDelta < 0 ? a : b;
  const lowerPerson = listDelta < 0 ? b : a;
  if (proximityMayOverrideList(lowerPerson, listPerson, vacancy)) {
    return listDelta < 0 ? 1 : -1;
  }
  return listDelta;
}

function betterProximityCandidateExists(pool, current, vacancy, requireCoverage, inputContext, allowMultiple) {
  const currentRank = proximityValue(current, vacancy);
  for (const other of pool) {
    if (other === current) continue;
    if (!allowMultiple && other._used) continue;
    if (!canTakeMoreWork(other)) continue;
    if (hasWorkConflict(other, vacancy)) continue;
    if (!hasRequiredCerts(other, vacancy)) continue;
    const specialtyCerts = specialtyNeededForVacancy(inputContext, vacancy);
    if (specialtyCerts.length && !hasAnyCert(other, specialtyCerts)) continue;
    const captainsLeft = availableCaptainCount(pool, vacancy, allowMultiple, requireCoverage, inputContext);
    const adjustedCaptainsLeft = captainsLeft - (isCaptainRolePerson(other) ? 1 : 0);
    if (!rankEligible(other, vacancy, adjustedCaptainsLeft)) continue;
    if (requireCoverage) {
      const cov = checkCoverage(other, vacancy);
      if (!cov.full) continue;
    }
    if (proximityMayOverrideList(other, current, vacancy)) return true;
  }
  return false;
}

function compareVacanciesForPerson(person, a, b) {
  if (b.hours !== a.hours) return b.hours - a.hours;
  const ac = isCaptainVacancy(a) ? 0 : 1;
  const bc = isCaptainVacancy(b) ? 0 : 1;
  if (ac !== bc) return ac - bc;
  const A = proximityValue(person, a);
  const B = proximityValue(person, b);
  if (A.tier !== B.tier && (A.tier < 2 || B.tier < 2)) return A.tier - B.tier;
  return toMinutes(a.start) - toMinutes(b.start);
}

function compareVacanciesForUnassigned(person, a, b) {
  if (b.hours !== a.hours) return b.hours - a.hours;
  const ac = isCaptainVacancy(a) ? 0 : 1;
  const bc = isCaptainVacancy(b) ? 0 : 1;
  if (ac !== bc) return ac - bc;
  return toMinutes(a.start) - toMinutes(b.start);
}

function availableCaptainCount(pool, vacancy = null, allowMultiple = true, requireCoverage = false, inputContext = null) {
  return pool.filter((p) => {
    if (!(p.rank === "FCPT" || p.actingCaptainRole)) return false;
    if (!canTakeMoreWork(p)) return false;
    if (!allowMultiple && p._used) return false;
    if (vacancy && hasWorkConflict(p, vacancy)) return false;
    if (vacancy && !hasRequiredCerts(p, vacancy)) return false;
    const specialtyCerts = vacancy ? specialtyNeededForVacancy(inputContext, vacancy) : [];
    if (specialtyCerts.length && !hasAnyCert(p, specialtyCerts)) return false;
    if (requireCoverage && vacancy) {
      const cov = checkCoverage(p, vacancy);
      if (!cov.full) return false;
    }
    return true;
  }).length;
}

function isCaptainRolePerson(person) {
  return person.rank === "FCPT" || !!person.actingCaptainRole;
}

function assignmentWindow(person, coverage) {
  if (coverage?.blockUsed === 2 && person.splitAvailability?.block2) {
    return person.splitAvailability.block2;
  }
  if (coverage?.blockUsed === 1 && person.splitAvailability?.block1) {
    return person.splitAvailability.block1;
  }
  return { start: person.availStart, end: person.availEnd };
}

function assignmentOverlapHours(person, vacancy, coverage) {
  const win = assignmentWindow(person, coverage);
  return Math.round(overlapMinutes(win.start, win.end, vacancy.start, vacancy.end) / 60 * 10) / 10;
}

function vacancyInterval(vacancy) {
  const start = toMinutes(vacancy.start);
  let end = toMinutes(vacancy.end);
  if (end <= start) end += 1440;
  return [start, end];
}

function intervalsOverlap(a, b) {
  return Math.max(a[0], b[0]) < Math.min(a[1], b[1]);
}

function hasWorkConflict(person, vacancy) {
  const next = vacancyInterval(vacancy);
  return (person._workIntervals || []).some((existing) => intervalsOverlap(existing, next));
}

function claimWork(person, vacancy) {
  if (!person._workIntervals) person._workIntervals = [];
  person._workIntervals.push(vacancyInterval(vacancy));
  person._used = true;
}

function canTakeMoreWork(person) {
  return person.available !== false && !isExcused(person);
}

// ─── Vacancy classification helpers ──────────────────────────────────────────

export function isCaptainVacancy(v) {
  return String(v.position || "").toLowerCase().includes("captain");
}

export function isUtility(v) {
  return v.isUtility || /utility\s*1/i.test(v.unit || "");
}

// ─── Sort vacancies: longest-first, captains before FF within same hours, utility last ─
//  Within same-hours captain vacancies, DAY half before NIGHT half so the
//  12hr-MHO rule naturally exhausts captains on Day → Night picks up acting.
export function sortVacancies(vacancies) {
  return [...vacancies].sort((a, b) => {
    const au = isUtility(a) ? 1 : 0;
    const bu = isUtility(b) ? 1 : 0;
    if (au !== bu) return au - bu;      // non-utility before utility
    if (b.hours !== a.hours) return b.hours - a.hours;  // longer first
    const ac = isCaptainVacancy(a) ? 0 : 1;
    const bc = isCaptainVacancy(b) ? 0 : 1;
    if (ac !== bc) return ac - bc;      // captains before FF
    // Earlier start-of-shift first.  This puts Day halves (08:00) before
    // Night halves (20:00) naturally, whether or not the vacancy was split,
    // so that the 12hr-MHO rule exhausts captains on Day → Night picks up acting.
    return toMinutes(a.start) - toMinutes(b.start);
  });
}

// ─── 12hr split preprocessor ────────────────────────────────────────────────
/**
 * Pre-processing step: any ≥24hr vacancy that will require MHO coverage
 * must be split into Day half (08:00-20:00) and Night half (20:00-08:00).
 * We proactively split every ≥24hr non-utility vacancy; if callback fills
 * both halves with the same person we still record a single assignment.
 *
 * Per spec: "The 12hr MHO max rule is a pre-processing step."
 */
export function splitLongVacancies(vacancies) {
  const out = [];
  for (const v of vacancies) {
    if (v.hours >= 24 && !isUtility(v)) {
      const base = { ...v };
      out.push({
        ...base,
        id: `${v.id}-D`,
        start: "08:00",
        end:   "20:00",
        hours: 12,
        half:  "DAY",
        splitOf: v.unit ? `${v.unit} (${v.position})` : String(v.id),
        sourceHours: v.hours,
      });
      out.push({
        ...base,
        id: `${v.id}-N`,
        start: "20:00",
        end:   "08:00",
        hours: 12,
        half:  "NIGHT",
        splitOf: v.unit ? `${v.unit} (${v.position})` : String(v.id),
        sourceHours: v.hours,
      });
    } else {
      out.push({ ...v, half: null, splitOf: null, sourceHours: v.hours });
    }
  }
  return out;
}

// ─── Person qualification ────────────────────────────────────────────────────

/** Is this person excused (cannot be forced)? */
export function isExcused(person) {
  return person.unavailReason && EXCUSED_CODES.has(String(person.unavailReason).toUpperCase());
}

/** Strict cert match — all required certs must be in person's certs array */
export function hasRequiredCerts(person, vacancy) {
  const req = vacancy.certReq || [];
  const have = new Set((person.certs || []).map((c) => String(c).toUpperCase()));
  return req.every((r) => have.has(String(r).toUpperCase()));
}

/**
 * Can this rank fill this vacancy, given how many captains remain on the list?
 * @param person       the candidate
 * @param vacancy      the slot
 * @param captainsLeft true FCPTs remaining on the active list
 */
export function rankEligible(person, vacancy, captainsLeft) {
  const r = person.rank;
  if (person.actingCaptainRole) {
    return isCaptainVacancy(vacancy);
  }
  if (isCaptainVacancy(vacancy)) {
    const rule = CAN_FILL_CAPTAIN[r];
    if (rule === "always") return true;
    if (rule === "if-exhausted") return captainsLeft === 0;
    return false;
  }
  // FF-class vacancy
  return !!CAN_FILL_FF[r];
}

/**
 * Compute coverage status for a person against a vacancy.
 * Returns { eligible, full, partial, fraction, blockUsed } — `blockUsed` is
 * 1, 2, or null and identifies which split-availability block (if any) was
 * the better fit.  The engine consumes the entire person record on
 * assignment, so the unused block is implicitly locked.
 */
export function checkCoverage(person, vacancy) {
  const eval1 = (start, end) => {
    const frac = coverageFraction(start, end, vacancy.start, vacancy.end);
    const full = fullyCovers(start, end, vacancy.start, vacancy.end);
    return {
      full,
      partial: !full && frac >= PARTIAL_COVERAGE_THRESHOLD,
      fraction: frac,
    };
  };

  // Primary window
  const primary = eval1(person.availStart, person.availEnd);
  let best = { ...primary, blockUsed: null };

  // Second block, if declared
  const split = person.splitAvailability;
  if (split?.block2) {
    const alt = eval1(split.block2.start, split.block2.end);
    // Prefer "full" over "partial" over "neither"; tie-break on fraction.
    const score = (c) => (c.full ? 2 : c.partial ? 1 : 0);
    if (score(alt) > score(best) || alt.fraction > best.fraction) {
      best = { ...alt, blockUsed: 2 };
    } else if (best.blockUsed == null && (best.full || best.partial)) {
      best.blockUsed = 1;
    }
  }

  return { eligible: best.full || best.partial, ...best };
}

// ─── Person-first assignment pass ────────────────────────────────────────────
/**
 * Assign people from `pool` to open vacancies using the person-first rule:
 * for each person in order, find the LONGEST vacancy they fully cover (or
 * partially cover ≥50% as fallback).
 *
 * Mutates openVacancies (removes filled) and returns assignments produced.
 */

export function runPersonFirstPass(pool, openVacancies, { tierLabel, sourcePrefix, skipUtility = true, unassignedCostFirst = false }) {
  const assigns = [];

  let madeAssignment = true;
  while (madeAssignment) {
    madeAssignment = false;

    for (const person of pool) {
      if (!canTakeMoreWork(person)) continue;

      const vacancyQueue = sortVacancies(
        [...openVacancies]
          .filter((v) => !v._filled)
          .filter((v) => (skipUtility ? !isUtility(v) : true))
      ).sort((a, b) =>
        unassignedCostFirst
          ? compareVacanciesForUnassigned(person, a, b)
          : compareVacanciesForPerson(person, a, b)
      );

      for (const picked of vacancyQueue) {
        if (hasWorkConflict(person, picked)) continue;
      const captainsLeft = availableCaptainCount(pool, picked, true, true, runPersonFirstPass.inputContext);
      if (!hasRequiredCerts(person, picked)) continue;
      const specialtyCerts = specialtyNeededForVacancy(runPersonFirstPass.inputContext, picked);
      if (specialtyCerts.length && !hasAnyCert(person, specialtyCerts)) continue;
      const adjustedCaptainsLeft = captainsLeft - (isCaptainRolePerson(person) ? 1 : 0);
      if (!rankEligible(person, picked, adjustedCaptainsLeft)) continue;
      const cov = checkCoverage(person, picked);
      if (!cov.full) continue;
      if (!unassignedCostFirst && betterProximityCandidateExists(pool, person, picked, true, runPersonFirstPass.inputContext, true)) continue;

      const acting = isCaptainVacancy(picked) && person.rank !== "FCPT";

      assigns.push({
        vacancyId: picked.id,
        vacancy: picked,
        personId: person.id,
        personName: person.name,
        rank: person.rank,
        certs: [...(person.certs || [])],
        tier: tierLabel,
        source: sourcePrefix + (person.listOrder ? " #" + person.listOrder : ""),
        overlap: assignmentOverlapHours(person, picked, cov),
        partialCoverage: cov.partial,
        coverageFraction: cov.fraction,
        blockUsed: cov.blockUsed ?? null,
        homeStation: person.homeStation ?? null,
        currentStation: person.currentStation ?? null,
        status: acting ? "acting" : "assigned",
        acting,
        flags: [],
        confirmed: false,
        overrideName: null,
        overrideReason: null,
      });

      claimWork(person, picked);
      picked._filled = true;
      madeAssignment = true;
      break;
    }

      // Restart from the top of the list after every assignment. This matters
      // for captain exhaustion: an earlier MFFII/FMFF may become eligible only
      // after a later true FCPT has been consumed.
      if (madeAssignment) break;
    }
  }

  return assigns;
}

function candidateForVacancyInListOrder(pool, vacancy, requireCoverage, inputContext = null, allowMultiple = true) {
  const captainsLeft = availableCaptainCount(pool, vacancy, allowMultiple, requireCoverage, inputContext);
  const specialtyCerts = specialtyNeededForVacancy(inputContext, vacancy);
  const eligible = [];
  for (const person of pool) {
    if (!allowMultiple && person._used) continue;
    if (!canTakeMoreWork(person)) continue;
    if (hasWorkConflict(person, vacancy)) continue;
    if (!hasRequiredCerts(person, vacancy)) continue;
    if (specialtyCerts.length && !hasAnyCert(person, specialtyCerts)) continue;
    const adjustedCaptainsLeft = captainsLeft - (isCaptainRolePerson(person) ? 1 : 0);
    if (!rankEligible(person, vacancy, adjustedCaptainsLeft)) continue;
    const cov = requireCoverage ? checkCoverage(person, vacancy) : null;
    if (requireCoverage) {
      if (!cov.full) continue;
      eligible.push({ person, cov });
      continue;
    }
    eligible.push({ person, cov: null });
  }
  if (!eligible.length) return null;
  eligible.sort((a, b) => compareByProximityThenList(a.person, b.person, vacancy));
  return eligible[0];
}


// --- Tier 5 MHO pass: in-list order, skip excused, apply rank exhaustion live ─
/**
 * MHO pass: work list top to bottom. For each member, find the longest
 * unfilled non-utility vacancy they qualify for. Captain exhaustion is
 * re-evaluated at every vacancy (per spec note #3).
 */

export function runMHOPass(mhoList, openVacancies) {
  const assigns = [];
  const vacancyQueue = sortVacancies(
    [...openVacancies].filter((v) => !v._filled && !isUtility(v))
  );

  for (const v of vacancyQueue) {
    if (v._filled) continue;

    const chosen = candidateForVacancyInListOrder(mhoList, v, false, runMHOPass.inputContext, false);
    if (!chosen) continue;

    const { person } = chosen;
    const acting = isCaptainVacancy(v) && person.rank !== "FCPT";

    assigns.push({
      vacancyId: v.id,
      vacancy: v,
      personId: person.id,
      personName: person.name,
      rank: person.rank,
      certs: [...(person.certs || [])],
      tier: "MHO",
      source: "MHO" + (person.listOrder ? " #" + person.listOrder : ""),
      overlap: v.hours,
      partialCoverage: false,
      coverageFraction: 1,
      homeStation: person.homeStation ?? null,
      currentStation: person.currentStation ?? null,
      status: acting ? "acting" : "assigned",
      acting,
      flags: [],
      confirmed: false,
      overrideName: null,
      overrideReason: null,
    });

    claimWork(person, v);
    v._filled = true;
  }

  return assigns;
}


// --- Utility 1 pass — callback only ──────────────────────────────────────────

export function runUtilityPass(callbackList, openVacancies) {
  const assigns = [];
  const utVacancies = openVacancies.filter((v) => !v._filled && isUtility(v))
                                   .sort((a, b) => b.hours - a.hours);

  for (const v of utVacancies) {
    const chosen = candidateForVacancyInListOrder(callbackList, v, true, runUtilityPass.inputContext, true);
    if (!chosen) continue;

    const { person, cov } = chosen;
    const acting = isCaptainVacancy(v) && person.rank !== "FCPT";

    assigns.push({
      vacancyId: v.id,
      vacancy: v,
      personId: person.id,
      personName: person.name,
      rank: person.rank,
      certs: [...(person.certs || [])],
      tier: "CALLBACK",
      source: "CB" + (person.listOrder ? " #" + person.listOrder : ""),
      overlap: assignmentOverlapHours(person, v, cov),
      partialCoverage: cov.partial,
      coverageFraction: cov.fraction,
      blockUsed: cov.blockUsed ?? null,
      homeStation: person.homeStation ?? null,
      currentStation: person.currentStation ?? null,
      status: acting ? "acting" : "assigned",
      acting,
      flags: [],
      confirmed: false,
      overrideName: null,
      overrideReason: null,
    });

    claimWork(person, v);
    v._filled = true;
  }

  return assigns;
}


// --- Unstaffed builder ───────────────────────────────────────────────────────
export function buildUnstaffed(openVacancies) {
  return openVacancies
    .filter((v) => !v._filled)
    .map((v) => ({
      vacancyId: v.id,
      vacancy: v,
      personId: null,
      personName: null,
      rank: null,
      certs: [],
      tier: "UNSTAFFED",
      source: isUtility(v) ? "Callback empty; MHO prohibited for UT-1" : "No qualified resource available",
      overlap: 0,
      partialCoverage: false,
      coverageFraction: 0,
      homeStation: null,
      currentStation: null,
      status: "unstaffed",
      acting: false,
      flags: [],
      confirmed: false,
      overrideName: null,
      overrideReason: null,
    }));
}

// ─── Main engine entry point ─────────────────────────────────────────────────
/**
 * Run the full assignment engine.
 *
 * @param {Object} input
 * @param {Array}  input.vacancies      — parsed vacancies from roster
 * @param {Array}  input.unassigned     — Tier 1 in-house unassigned members
 * @param {Array}  input.callbackPre    — Tier 3 callback (pre-1200)
 * @param {Array}  input.callbackPost   — Tier 4 callback (post-1200)
 * @param {Array}  input.mho            — Tier 5 MHO list
 * @returns {Object} { vacancies, assignments, unstaffed }
 */
export function runEngine(input) {
  const {
    vacancies = [],
    unassigned = [],
    callbackPre = [],
    callbackPost = [],
    mho = [],
  } = input || {};

  // ── 0. Reset transient flags (pure-ish — we operate on shallow clones) ──
  const cloneP = (p) => ({ ...p, _used: false });
  const cloneV = (v) => ({ ...v, _filled: false });

  const pool1 = unassigned.map(cloneP);
  // Apply spec priority sort to callback + MHO pools.  When lastUsed /
  // totalHours are absent (e.g. unit-test fixture), the helper preserves the
  // incoming listOrder so existing test behavior is unchanged.
  const pool3 = prioritySortPool(callbackPre.map(cloneP));
  const pool4 = prioritySortPool(callbackPost.map(cloneP));
  const pool5 = prioritySortPool(mho.map(cloneP));

  // ── 1. Run callback / unassigned passes on UNSPLIT vacancies. ──
  //      Per spec: "Do not split a 24-hour vacancy if it is filled by callback."
  const ordered = sortVacancies(vacancies.map(cloneV));

  // Tier 1: in-house unassigned (skip utility)
  runPersonFirstPass.inputContext = input;
  const t1 = runPersonFirstPass(pool1, ordered, {
    tierLabel: "UNASSIGNED",
    sourcePrefix: "Tier 1 — Unassigned",
    skipUtility: true,
    unassignedCostFirst: true,
  });

  // Tier 3: callback pre-1200
  runPersonFirstPass.inputContext = input;
  const t3 = runPersonFirstPass(pool3, ordered, {
    tierLabel: "CALLBACK",
    sourcePrefix: "CB",
    skipUtility: true,
  });

  // Tier 4: callback post-1200
  runPersonFirstPass.inputContext = input;
  const t4 = runPersonFirstPass(pool4, ordered, {
    tierLabel: "CALLBACK",
    sourcePrefix: "CB-post",
    skipUtility: true,
  });

  // ── 2. Now split any unfilled ≥24hr non-utility vacancies for MHO. ──
  //      The 12-hr MHO max rule only applies when MHO is actually being used.
  for (let i = ordered.length - 1; i >= 0; i--) {
    const v = ordered[i];
    if (!v._filled && v.hours >= 24 && !isUtility(v) && !v.splitOf) {
      const splitOf = v.unit ? `${v.unit} (${v.position})` : String(v.id);
      const day = {
        ...v, id: `${v.id}-D`, start: "08:00", end: "20:00", hours: 12,
        half: "DAY", splitOf, sourceHours: v.hours, _filled: false,
      };
      const night = {
        ...v, id: `${v.id}-N`, start: "20:00", end: "08:00", hours: 12,
        half: "NIGHT", splitOf, sourceHours: v.hours, _filled: false,
      };
      ordered.splice(i, 1, day, night);
    }
  }
  // Re-sort after splicing in halves (engine-internal canonical order).
  ordered.sort((a, b) => {
    const au = isUtility(a) ? 1 : 0, bu = isUtility(b) ? 1 : 0;
    if (au !== bu) return au - bu;
    if (b.hours !== a.hours) return b.hours - a.hours;
    const ac = isCaptainVacancy(a) ? 0 : 1, bc = isCaptainVacancy(b) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return toMinutes(a.start) - toMinutes(b.start);
  });

  // ── 3. Tier 5: MHO ──
  runMHOPass.inputContext = input;
  const t5 = runMHOPass(pool5, ordered);

  // ── 4. Utility 1 — callback only, full coverage only ──
  const combinedCB = [...pool3, ...pool4];
  runUtilityPass.inputContext = input;
  const ut = runUtilityPass(combinedCB, ordered);

  // ── 7. Consolidate split halves if the same non-MHO member covers both.
  //      (24hr callbacks are permitted to fill a 24hr vacancy without split.)
  const consolidated = consolidateSplitHalves([...t1, ...t3, ...t4, ...t5, ...ut]);

  // ── 8. Unstaffed ──
  const unstaffed = buildUnstaffed(ordered);

  // ── 9. Final list in the correct UI processing order ──
  const allAssignments = [...consolidated, ...unstaffed];
  const ordering = new Map(ordered.map((v, i) => [v.id, i]));
  allAssignments.sort((a, b) => (ordering.get(a.vacancyId) ?? 0) - (ordering.get(b.vacancyId) ?? 0));

  return {
    vacancies: ordered,
    assignments: allAssignments,
    unstaffed,
  };
}

/**
 * If a single non-MHO person covered both Day and Night halves of a 24hr
 * vacancy, merge them into a single assignment. (Callback can cover 24hr
 * without split per spec.)  MHO stays split.
 */
function consolidateSplitHalves(assigns) {
  const byPersonKey = new Map();
  const result = [];

  for (const a of assigns) {
    if (!a.vacancy?.splitOf) { result.push(a); continue; }
    if (a.tier === "MHO") { result.push(a); continue; }  // MHO must remain split

    const key = `${a.personId}|${a.vacancy.splitOf}`;
    const existing = byPersonKey.get(key);
    if (!existing) {
      byPersonKey.set(key, a);
    } else {
      // merge into a single 24hr record
      const day = a.vacancy.half === "DAY" ? a : existing;
      const night = a.vacancy.half === "NIGHT" ? a : existing;
      const merged = {
        ...a,
        vacancyId: `${a.vacancy.id.replace(/-(D|N)$/, "")}`,
        vacancy: {
          ...a.vacancy,
          id:    a.vacancy.id.replace(/-(D|N)$/, ""),
          start: day.vacancy.start,
          end:   night.vacancy.end,
          hours: 24,
          half:  null,
          splitOf: null,
        },
        overlap: 24,
      };
      result.push(merged);
      byPersonKey.delete(key);
    }
  }
  // Anything left in byPersonKey had no pair — push back
  for (const a of byPersonKey.values()) result.push(a);
  return result;
}

// ─── Helpers for UI ──────────────────────────────────────────────────────────

export function getStats(assignments) {
  const total = assignments.length;
  const filled = assignments.filter((a) => a.status !== "unstaffed").length;
  const mhoUsed = assignments.filter((a) => a.tier === "MHO").length;
  const actingCapt = assignments.filter((a) => a.acting).length;
  const unstaffed = assignments.filter((a) => a.status === "unstaffed").length;
  return { total, filled, mhoUsed, actingCapt, unstaffed };
}
