// ─────────────────────────────────────────────────────────────────────────────
//  Parser orchestration — reads both workbooks and returns engine input plus
//  diagnostics.  Real per-sheet parsers live alongside this file (rosterParser,
//  cbmhoParser).  This module wires them together and surfaces clear, actionable
//  diagnostics when the input doesn't look like a TeleStaff/CBMHO export.
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from "xlsx";
import { parseRoster } from "./rosterParser.js";
import { parseCBMHO } from "./cbmhoParser.js";

async function readWorkbook(file) {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array", cellDates: true });
}

/** Resolve a sheet by name, case-insensitive, trim-tolerant. */
export function findSheet(wb, target) {
  const want = String(target).trim().toLowerCase();
  const name = wb.SheetNames.find((n) => n.trim().toLowerCase() === want);
  return name ? { name, sheet: wb.Sheets[name] } : null;
}

export function rawRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
}

/**
 * Parse both files. Returns:
 *   { input, diagnostics, fatal }
 * where input is the runEngine() input shape, or null if a fatal error blocks
 * the run.  diagnostics always contains best-effort metadata.
 */
export async function parseUploads(rosterFile, cbmhoFile) {
  const diag = {
    rosterFilename: rosterFile?.name || null,
    cbmhoFilename:  cbmhoFile?.name  || null,
    rosterSheets:   [],
    cbmhoSheets:    [],
    rosterRowCount: null,
    cbmhoRowCount:  null,
    vacancies:      0,
    unassigned:     0,
    muP:            0,
    callbackPre:    0,
    callbackPost:   0,
    mho:            0,
    warnings:       [],
  };
  let fatal = null;

  try {
    if (!rosterFile || !cbmhoFile) {
      fatal = "Both Roster Report and CBMHO workbooks are required.";
      return { input: null, diagnostics: diag, fatal };
    }

    const rosterWb = await readWorkbook(rosterFile);
    const cbmhoWb  = await readWorkbook(cbmhoFile);
    diag.rosterSheets = rosterWb.SheetNames;
    diag.cbmhoSheets  = cbmhoWb.SheetNames;

    // ── Roster ────────────────────────────────────────────────────────────
    const rosterSheet = findSheet(rosterWb, "Roster Report");
    if (!rosterSheet) {
      diag.warnings.push("Roster sheet 'Roster Report' not found — uploaded file may not be a TeleStaff export.");
    }
    const rosterRows = rosterSheet ? rawRows(rosterSheet.sheet) : [];
    diag.rosterRowCount = rosterRows.length;

    const roster = rosterSheet
      ? parseRoster(rosterRows)
      : { vacancies: [], unassigned: [], muP: [], unconfirmed: [], shiftMeta: {}, warnings: [] };

    diag.vacancies   = roster.vacancies.length;
    diag.unassigned  = roster.unassigned.length;
    diag.muP         = roster.muP.length;
    diag.warnings.push(...(roster.warnings || []));

    // ── CBMHO ─────────────────────────────────────────────────────────────
    const cbSheet  = findSheet(cbmhoWb, "CBMHO List");
    const pulledSh = findSheet(cbmhoWb, "Callback List as Pulled");
    if (!cbSheet) {
      diag.warnings.push("Sheet 'CBMHO List' not found — uploaded file may not be a CBMHO export.");
    }
    const cbRows     = cbSheet  ? rawRows(cbSheet.sheet)  : [];
    const pulledRows = pulledSh ? rawRows(pulledSh.sheet) : [];
    diag.cbmhoRowCount = cbRows.length;

    const cbmho = cbSheet
      ? parseCBMHO(cbRows, pulledRows)
      : { callbackPre: [], callbackPost: [], mho: [], offMandatory: [], shiftMeta: {}, warnings: [] };

    diag.callbackPre  = cbmho.callbackPre.length;
    diag.callbackPost = cbmho.callbackPost.length;
    diag.mho          = cbmho.mho.length;
    diag.warnings.push(...(cbmho.warnings || []));

    // ── Validate we have something to recommend on ────────────────────────
    if (diag.vacancies === 0) {
      diag.warnings.push("No vacancies detected on roster (no '?,?' / '-,-' rows found).");
    }

    const shiftMeta = { ...(cbmho.shiftMeta || {}), ...(roster.shiftMeta || {}) };

    const input = {
      vacancies:     roster.vacancies,
      unassigned:    roster.unassigned,
      callbackPre:   cbmho.callbackPre,
      callbackPost:  cbmho.callbackPost,
      mho:           cbmho.mho,
      muP:           roster.muP,
      unconfirmed:   roster.unconfirmed,
      offMandatory:  cbmho.offMandatory,
      captainSeats:  roster.captainSeats || [],
      inHouseMembers: roster.inHouseMembers || [],
      shiftMeta,
    };
    return { input, diagnostics: diag, fatal: null };
  } catch (err) {
    return {
      input: null,
      diagnostics: diag,
      fatal: `Could not parse workbooks: ${err.message || err}`,
    };
  }
}
