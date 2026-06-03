// Rank groups — used for captain-fill exhaustion logic
export const RANK_GROUP = {
  FFI:   "FF",
  FFII:  "FF",
  MFF:   "MFF",
  MFFII: "MFF",
  FMFF:  "MFF",
  FCPT:  "FCPT",
};

// Can a given rank fill a captain slot?
// Per spec: Captains always yes. MFF/MFFII/FMFF only if no captains remain.
// FF ranks: never.
export const CAN_FILL_CAPTAIN = {
  FCPT:  "always",
  MFF:   "if-exhausted",
  MFFII: "if-exhausted",
  FMFF:  "if-exhausted",
  FFI:   "never",
  FFII:  "never",
};

// Can a given rank fill a firefighter slot?
// Captains cannot fill down. Everyone else yes.
export const CAN_FILL_FF = {
  FCPT:  false,
  MFF:   true,
  MFFII: true,
  FMFF:  true,
  FFI:   true,
  FFII:  true,
};

// Battalion captain minimums (50% rule)
export const BATTALION_CAPTAIN_MINIMUMS = {
  1: 4,
  2: 4,
  3: 4,
  4: 3,
  5: 3,
};

// Stations
export const STATIONS = {
  1:  { name: "First Landing",     address: "2387 Shore Drive" },
  2:  { name: "Davis Corner",       address: "4672 Haygood Road" },
  3:  { name: "London Bridge",      address: "600 Central Drive" },
  4:  { name: "Chesapeake Beach",   address: "2211 Greenwell Road" },
  5:  { name: "Princess Anne",      address: "2461 Princess Anne Road" },
  6:  { name: "Creeds",             address: "595 Princess Anne Road" },
  7:  { name: "Town Center",        address: "4817 Columbus Street" },
  8:  { name: "Oceana",             address: "1201 Bayne Drive" },
  9:  { name: "Kempsville",         address: "5145 Ruritan Court" },
  10: { name: "Woodstock",          address: "5656 Providence Road" },
  11: { name: "Beach Borough",      address: "800 Virginia Beach Blvd" },
  12: { name: "Seatack",            address: "949 S. Birdneck Road" },
  13: { name: "Blackwater",         address: "6009 Blackwater Road" },
  15: { name: "Fort Story",         address: "700 Atlantic Ave" },
  16: { name: "Plaza",              address: "3608 S. Plaza Trail" },
  17: { name: "Sandbridge",         address: "305 Sandbridge Road" },
  18: { name: "Green Run",          address: "1601 Lynnhaven Parkway" },
  19: { name: "Stumpy Lake",        address: "4196 Pleasant Valley Road" },
  20: { name: "Little Neck",        address: "885 Little Neck Road" },
  21: { name: "General Booth",      address: "1468 Nimmo Parkway" },
  22: { name: "Burton Station",     address: "1160 Tolliver Road" },
};

// Official FR 401 Appendix A station-to-station mileage chart.
// Merged with supplied Station 15 and Station 22 mileage sheets.
export const STATION_MILEAGE = {
  "1-2": 6.4,
  "2-2": 0,
  "2-3": 9.1,
  "2-4": 3.2,
  "2-5": 10.8,
  "2-6": 23.3,
  "2-7": 3.2,
  "2-8": 10,
  "2-9": 4.4,
  "2-10": 6.9,
  "2-11": 12.3,
  "2-12": 14.6,
  "2-13": 22.8,
  "2-16": 5.5,
  "2-17": 19,
  "2-18": 6.8,
  "2-19": 7.5,
  "2-20": 6.7,
  "2-21": 12.3,
  "1-3": 7.8,
  "3-3": 0,
  "3-4": 11.2,
  "3-5": 8.7,
  "3-6": 18.8,
  "3-7": 6.9,
  "3-8": 4.7,
  "3-9": 7.4,
  "3-10": 8.9,
  "3-11": 5.7,
  "3-12": 8.1,
  "3-13": 19.2,
  "3-16": 3.7,
  "3-17": 12.6,
  "3-18": 3.3,
  "3-19": 6.2,
  "3-20": 4.7,
  "3-21": 6.6,
  "1-4": 3.4,
  "4-4": 0,
  "4-5": 13.3,
  "4-6": 25.7,
  "4-7": 5.6,
  "4-8": 8.3,
  "4-9": 6.8,
  "4-10": 10.7,
  "4-11": 11.1,
  "4-12": 14.5,
  "4-13": 25.2,
  "4-16": 8.6,
  "4-17": 21.4,
  "4-18": 9.2,
  "4-19": 9.9,
  "4-20": 9.1,
  "4-21": 14.7,
  "1-5": 13.9,
  "5-5": 0,
  "5-6": 12.6,
  "5-7": 9.3,
  "5-8": 10.8,
  "5-9": 8,
  "5-10": 9,
  "5-11": 9.5,
  "5-12": 6.5,
  "5-13": 14.5,
  "5-16": 6.6,
  "5-17": 8.6,
  "5-18": 4.6,
  "5-19": 6.3,
  "5-20": 9.3,
  "5-21": 2.5,
  "1-6": 24.6,
  "6-6": 0,
  "6-7": 21.7,
  "6-8": 20.9,
  "6-9": 20.3,
  "6-10": 21.3,
  "6-11": 19.1,
  "6-12": 16.1,
  "6-13": 5.9,
  "6-16": 18.9,
  "6-17": 14.4,
  "6-18": 17,
  "6-19": 18.4,
  "6-20": 21.7,
  "6-21": 12.8,
  "1-7": 9.1,
  "7-7": 0,
  "7-8": 8.4,
  "7-9": 2.3,
  "7-10": 4.8,
  "7-11": 9.3,
  "7-12": 12.2,
  "7-13": 20.4,
  "7-16": 3.5,
  "7-17": 16.6,
  "7-18": 4.4,
  "7-19": 5,
  "7-20": 4.7,
  "7-21": 9.9,
  "1-8": 4.6,
  "8-8": 0,
  "8-9": 10,
  "8-10": 11.8,
  "8-11": 4.1,
  "8-12": 6.6,
  "8-13": 23.5,
  "8-16": 6,
  "8-17": 14.9,
  "8-18": 7.9,
  "8-19": 10.7,
  "8-20": 6.6,
  "8-21": 9,
  "1-9": 1.06,
  "9-9": 0,
  "9-10": 2.6,
  "9-11": 10.7,
  "9-12": 14,
  "9-13": 19.3,
  "9-16": 4.6,
  "9-17": 16.5,
  "9-18": 4.5,
  "9-19": 3.9,
  "9-20": 6.7,
  "9-21": 9.9,
  "1-10": 14.6,
  "10-10": 0,
  "10-11": 13.6,
  "10-12": 13.8,
  "10-13": 19.4,
  "10-16": 6.2,
  "10-17": 17.4,
  "10-18": 5.4,
  "10-19": 3.6,
  "10-20": 8.9,
  "10-21": 10.7,
  "1-11": 7.8,
  "11-11": 0,
  "11-12": 3.4,
  "11-13": 22.7,
  "11-16": 6.9,
  "11-17": 13.1,
  "11-18": 8.9,
  "11-19": 11.9,
  "11-20": 7.6,
  "11-21": 7.2,
  "1-12": 9,
  "12-12": 0,
  "12-13": 20.6,
  "12-16": 8,
  "12-17": 11.1,
  "12-18": 9.6,
  "12-19": 12.1,
  "12-20": 8.8,
  "12-21": 5.2,
  "1-13": 26.7,
  "13-13": 0,
  "13-16": 19.6,
  "13-17": 18,
  "13-18": 16.6,
  "13-19": 17.1,
  "13-20": 22.1,
  "13-21": 16.3,
  "1-16": 9.3,
  "16-16": 0,
  "16-17": 14.3,
  "16-18": 2.8,
  "16-19": 4.5,
  "16-20": 2.9,
  "16-21": 7.6,
  "1-17": 18.6,
  "17-17": 0,
  "17-18": 13.2,
  "17-19": 15,
  "17-20": 17.1,
  "17-21": 6.8,
  "1-18": 10.9,
  "18-18": 0,
  "18-19": 3,
  "18-20": 5.5,
  "18-21": 6.4,
  "1-19": 13.8,
  "19-19": 0,
  "19-20": 8.4,
  "19-21": 8.2,
  "1-20": 9.7,
  "20-20": 0,
  "20-21": 11.1,
  "1-21": 12.6,
  "21-21": 0,
  "15-15": 0,
  "1-15": 6.7,
  "2-15": 13.2,
  "3-15": 13.2,
  "4-15": 9.8,
  "5-15": 15.7,
  "6-15": 25.1,
  "7-15": 15.7,
  "8-15": 11.3,
  "9-15": 17.3,
  "10-15": 19.5,
  "11-15": 6.9,
  "12-15": 9.6,
  "13-15": 28.6,
  "15-16": 13.4,
  "15-17": 19.1,
  "15-18": 15.4,
  "15-19": 20.5,
  "15-20": 14.9,
  "15-21": 13.1,
  "15-22": 14.1,
  "22-22": 0,
  "1-22": 7.6,
  "2-22": 5.1,
  "3-22": 13,
  "4-22": 4.3,
  "5-22": 14.7,
  "6-22": 26.7,
  "7-22": 5.1,
  "8-22": 14.6,
  "9-22": 6.9,
  "10-22": 7.1,
  "11-22": 16.2,
  "12-22": 17.8,
  "13-22": 25.3,
  "16-22": 9.9,
  "17-22": 24.2,
  "18-22": 11.2,
  "19-22": 9.5,
  "20-22": 12.4,
  "21-22": 20.5,
  "1-1": 0,
  "14-14": 0
};

// Approximate latitude/longitude for each VBFD station — used only for the
// proximity tiebreaker / long-travel advisory flag.  Values are coarse (to
// within ~0.005°) and intended for relative-distance comparison, NOT for
// dispatch routing.
export const STATION_COORDS = {
  1:  { lat: 36.910, lng: -76.057 },
  2:  { lat: 36.840, lng: -76.140 },
  3:  { lat: 36.840, lng: -76.060 },
  4:  { lat: 36.820, lng: -76.190 },
  5:  { lat: 36.755, lng: -76.040 },
  6:  { lat: 36.620, lng: -76.000 },
  7:  { lat: 36.840, lng: -76.110 },
  8:  { lat: 36.815, lng: -76.030 },
  9:  { lat: 36.815, lng: -76.180 },
  10: { lat: 36.820, lng: -76.165 },
  11: { lat: 36.852, lng: -75.978 },
  12: { lat: 36.840, lng: -75.985 },
  13: { lat: 36.700, lng: -76.080 },
  15: { lat: 36.925, lng: -76.000 },
  16: { lat: 36.815, lng: -76.075 },
  17: { lat: 36.730, lng: -75.940 },
  18: { lat: 36.785, lng: -76.105 },
  19: { lat: 36.770, lng: -76.115 },
  20: { lat: 36.870, lng: -76.103 },
  21: { lat: 36.755, lng: -76.005 },
  22: { lat: 36.870, lng: -76.140 },
};

// Official driving miles between two station numbers.
// Falls back to coordinate estimate only if the official chart lacks a pair.
export function stationDistanceMiles(a, b) {
  const from = Number(a);
  const to = Number(b);
  if (!from || !to) return null;
  const key = [Math.min(from, to), Math.max(from, to)].join("-");
  if (Object.prototype.hasOwnProperty.call(STATION_MILEAGE, key)) {
    return STATION_MILEAGE[key];
  }
  const A = STATION_COORDS[from], B = STATION_COORDS[to];
  if (!A || !B) return null;
  if (from === to) return 0;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(B.lat - A.lat);
  const dLng = toRad(B.lng - A.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(A.lat)) * Math.cos(toRad(B.lat)) * Math.sin(dLng / 2) ** 2;
  return 1.3 * 2 * R * Math.asin(Math.sqrt(h));
}

// Station-to-battalion (inferred from spec context; adjust as needed)
export const STATION_BATTALION = {
  1: 1, 2: 2, 3: 1, 4: 2, 5: 3, 6: 4, 7: 4, 8: 2, 9: 2, 10: 5,
  11: 1, 12: 1, 13: 4, 15: 1, 16: 3, 17: 4, 18: 3, 19: 3, 20: 2, 21: 3, 22: 5,
};

// Specialty cert minimums per shift.
//   `station`            — where the cert must be present in-house.
//   `cert`               — required cert code (matched against person.certs).
//   `count`              — minimum total members at the station carrying the cert.
//   `apparatus` / `onApparatus` — optional sub-requirement (advisory only).
//   `seasonal`           — optional { startMonth, endMonth } 1-indexed; rule
//                          only applies when "today" falls inside the window.
export const SPECIALTY_MINIMUMS = [
  { station: 3, cert: "HZM",  count: 4, apparatus: "Rescue 01", onApparatus: 3, note: "4 HZM total at Sta 03, min 3 on Rescue 01" },
  { station: 7, cert: "TECH", count: 4, apparatus: "Rescue 02", onApparatus: 3, note: "4 TECH total at Sta 07, min 3 on Rescue 02" },
  { station: 3, cert: "RSQ",  count: 3, apparatus: "Rescue 01", onApparatus: 3, note: "3 RSQ on Rescue 01" },
  { station: 7, cert: "RSQ",  count: 3, apparatus: "Rescue 02", onApparatus: 3, note: "3 RSQ on Rescue 02" },
  // Marine
  { station: 1,  cert: "MO1",  count: 2, apparatus: "Fire Boat 1/2",  note: "2 MO operators at Sta 01 (Fire Boat 1/2)" },
  { station: 1,  cert: "MC",   count: 3, apparatus: "Marine crew",     note: "3 Marine Crew at Sta 01" },
  { station: 6,  cert: "MO6",  count: 1, apparatus: "Fire Boat 6",     note: "1 MO operator at Sta 06 (Fire Boat 6)" },
  { station: 6,  cert: "MC",   count: 2, apparatus: "Marine crew",     note: "2 Marine Crew at Sta 06" },
  { station: 12, cert: "MO12", count: 1, apparatus: "Fire Boat 12",    note: "1 MO operator at Sta 12 (Fire Boat 12)" },
  { station: 12, cert: "MC",   count: 2, apparatus: "Marine crew",     note: "2 Marine Crew at Sta 12" },
  // Seasonal — Rescue Swimmer (FRS) — May 1 → Oct 31, Sta 01/11/15/17 × 2
  { station: 1,  cert: "FRS", count: 2, seasonal: { startMonth: 5, endMonth: 10 }, note: "2 FRS at Sta 01 (May–Oct)" },
  { station: 11, cert: "FRS", count: 2, seasonal: { startMonth: 5, endMonth: 10 }, note: "2 FRS at Sta 11 (May–Oct)" },
  { station: 15, cert: "FRS", count: 2, seasonal: { startMonth: 5, endMonth: 10 }, note: "2 FRS at Sta 15 (May–Oct)" },
  { station: 17, cert: "FRS", count: 2, seasonal: { startMonth: 5, endMonth: 10 }, note: "2 FRS at Sta 17 (May–Oct)" },
];

// Operational seasonal rules — advisory reminders surfaced as flags when
// today's date falls inside the window.  These are decision-support notes
// for the staffing officer; the engine does not enforce PAR levels.
export const SEASONAL_RULES = [
  {
    id: "SUMMER_UPSTAFFING",
    title: "Summer Upstaffing in Effect",
    window: { startMonth: 5, endMonth: 9 },         // May 1 – Sep 30
    body:
      "May 1 – Sep 30: E11, E14, L1 staffed at PAR 4 from Fri 1800 through Sun 0800. " +
      "Confirm appropriate vacancies are surfaced for these apparatus on weekend shifts.",
  },
  {
    id: "SUPPORT_8",
    title: "Support 8 / MCI Bus Active",
    window: { startMonth: 6, endMonth: 8 },         // Jun 1 – Aug 31
    body:
      "Jun 1 – Aug 31: Support 8 / MCI Bus active. Callbacks, MHO, and MHE all approved for these positions.",
  },
  {
    id: "RESCUE_SWIMMER_SEASON",
    title: "Rescue Swimmer Season Active",
    window: { startMonth: 5, endMonth: 10 },        // May 1 – Oct 31
    body:
      "May 1 – Oct 31: 2 FRS per shift required at Sta 01 / 11 / 15 / 17.",
  },
];

// Helper: is a seasonal window active for the given Date?
export function isSeasonalActive(seasonal, date = new Date()) {
  if (!seasonal) return true;
  const m = date.getMonth() + 1;            // 1-12
  const { startMonth, endMonth } = seasonal;
  if (startMonth <= endMonth) return m >= startMonth && m <= endMonth;
  return m >= startMonth || m <= endMonth;  // wraps year boundary
}

// Leave codes that make a member ineligible (cannot be forced for MHO)
export const EXCUSED_CODES = new Set([
  "FMLA", "FMLAMB", "FMLASPL",
  "ANNUAL", "A/L", "A24",
  "COMP", "SICK", "S/L",
  "TDA",
  "MU P", "MU",
]);

// Status codes requiring officer confirmation (flag as unconfirmed)
export const UNCONFIRMED_CODES = new Set(["MOB", "APM", "RAW", "PFF", "MMRST", "HRIM"]);

// Station exceptions (units homed at non-matching station)
export const UNIT_HOME_STATION = {
  "Engine 14":     11,
  "Fire Rescue 1": 3,
  "FR1":           3,
  "Fire Rescue 2": 7,
  "FR2":           7,
};

export const MHO_MAX_HOURS = 12;
export const PARTIAL_COVERAGE_THRESHOLD = 0.5; // 50%
