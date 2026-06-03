// ─────────────────────────────────────────────────────────────────────────────
//  Time-window parsing for VBFD callback / roster strings.
//  Supports:
//    08*08, 08*20, 20*08, 22*08, 08:00 / 20:00, 0800/2000,
//    slash-split availability (08*20/20*08).
// ─────────────────────────────────────────────────────────────────────────────

/** Pad a 1-or-2-digit hour into "HH:00".  Returns null if not numeric. */
function hourToHHMM(s) {
  const v = String(s).trim();
  if (/^\d{1,2}$/.test(v)) return v.padStart(2, "0") + ":00";
  if (/^\d{1,2}:\d{2}$/.test(v)) {
    const [h, m] = v.split(":");
    return h.padStart(2, "0") + ":" + m;
  }
  if (/^\d{4}$/.test(v)) return v.slice(0, 2) + ":" + v.slice(2);
  return null;
}

/**
 * Parse a single window like "08*08" or "08-20" or "08:00 - 20:00".
 * Returns { start, end } in HH:MM, or null if unparseable.
 */
export function parseSingleWindow(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Common separators: *, -, –, "to"
  const m = s.match(/^([0-9:]{1,5})\s*[*\-–]\s*([0-9:]{1,5})$/i)
        || s.match(/^([0-9:]{1,5})\s+to\s+([0-9:]{1,5})$/i);
  if (!m) return null;

  const a = hourToHHMM(m[1]);
  const b = hourToHHMM(m[2]);
  if (!a || !b) return null;
  return { start: a, end: b };
}

/**
 * Parse a possibly-split availability string like "08*20/20*08".
 * Returns an array of {start,end}.  Empty array if unparseable.
 */
export function parseAvailability(raw) {
  if (!raw) return [];
  return String(raw)
    .split("/")
    .map((seg) => parseSingleWindow(seg.trim()))
    .filter(Boolean);
}

/**
 * Pick the first window from a split availability for engine purposes.
 * Per spec: "For initial implementation, use the first block."
 * Caller can switch later to a smarter window-selection strategy.
 */
export function pickPrimaryWindow(raw) {
  const wins = parseAvailability(raw);
  return wins[0] || null;
}

/**
 * Hours covered by a window (handles midnight crossing).
 */
export function windowHours(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  if (e <= s) e += 24 * 60;
  return (e - s) / 60;
}
