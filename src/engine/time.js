// ── Time math helpers ────────────────────────────────────────────────────────
// All times are "HH:MM" strings. We convert to minutes-since-00:00.
// Windows that cross midnight (end <= start) have 1440 added to end.

export function toMinutes(hhmm) {
  if (hhmm == null) return 0;
  if (typeof hhmm === "number") return hhmm;
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMinutes(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Returns a normalized [start, end) minute range where end > start.
 * end is increased by 1440 when the window crosses midnight.
 * Special case: start === end means a full 24 hours (e.g. "08:00-08:00").
 */
export function normalizeWindow(start, end) {
  const s = toMinutes(start);
  let e = toMinutes(end);
  if (e <= s) e += 1440;
  return [s, e];
}

/** Duration of a window in hours (handles midnight cross). */
export function windowHours(start, end) {
  const [s, e] = normalizeWindow(start, end);
  return (e - s) / 60;
}

/**
 * Returns the number of overlap minutes between two windows.
 * Handles midnight-crossing windows by shifting into extended-day space.
 */
export function overlapMinutes(aStart, aEnd, bStart, bEnd) {
  const [as, ae] = normalizeWindow(aStart, aEnd);
  const [bs, be] = normalizeWindow(bStart, bEnd);

  // Normalize to same day-base by trying both b and b+1440
  let best = 0;
  for (const shift of [0, 1440, -1440]) {
    const bss = bs + shift;
    const bee = be + shift;
    const lo = Math.max(as, bss);
    const hi = Math.min(ae, bee);
    if (hi > lo) best = Math.max(best, hi - lo);
  }
  return best;
}

/** Does person window fully cover vacancy window? */
export function fullyCovers(pStart, pEnd, vStart, vEnd) {
  const vLen = (normalizeWindow(vStart, vEnd)[1] - normalizeWindow(vStart, vEnd)[0]);
  return overlapMinutes(pStart, pEnd, vStart, vEnd) >= vLen;
}

/** Fraction of vacancy covered by person, in [0,1]. */
export function coverageFraction(pStart, pEnd, vStart, vEnd) {
  const [vs, ve] = normalizeWindow(vStart, vEnd);
  const vLen = ve - vs;
  if (vLen === 0) return 0;
  return overlapMinutes(pStart, pEnd, vStart, vEnd) / vLen;
}

/** Parse a split availability string like "08*20/20*08" → [{start,end}, ...] */
export function parseSplitAvailability(raw) {
  if (!raw) return [];
  const segs = String(raw).split("/").map((s) => s.trim()).filter(Boolean);
  return segs.map((seg) => {
    const [a, b] = seg.split(/[*\-–]/).map((p) => p.trim());
    return {
      start: a.length <= 2 ? `${a.padStart(2, "0")}:00` : a,
      end:   b.length <= 2 ? `${b.padStart(2, "0")}:00` : b,
    };
  });
}
