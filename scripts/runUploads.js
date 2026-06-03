// Headless harness — feed real .xlsx files through the same parser+engine
// path the browser uses, dump diagnostics + assignments to stdout.

import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { parseRoster } from "../src/parsers/rosterParser.js";
import { parseCBMHO }  from "../src/parsers/cbmhoParser.js";
import { runEngine, getStats } from "../src/engine/engine.js";
import { buildFlags, highCount } from "../src/engine/flags.js";

function findSheet(wb, target) {
  const want = String(target).trim().toLowerCase();
  const name = wb.SheetNames.find((n) => n.trim().toLowerCase() === want);
  return name ? { name, sheet: wb.Sheets[name] } : null;
}
function rawRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1, defval: "", raw: false, blankrows: false,
  });
}

const rosterPath = process.argv[2];
const cbmhoPath  = process.argv[3];
if (!rosterPath || !cbmhoPath) {
  console.error("usage: node runUploads.js <roster.xlsx> <cbmho.xlsx>");
  process.exit(1);
}

const rosterWb = XLSX.read(fs.readFileSync(rosterPath));
const cbmhoWb  = XLSX.read(fs.readFileSync(cbmhoPath));

console.log("\n══ FILES ══");
console.log("Roster:", path.basename(rosterPath));
console.log("CBMHO :", path.basename(cbmhoPath));
console.log("Roster sheets:", rosterWb.SheetNames);
console.log("CBMHO  sheets:", cbmhoWb.SheetNames);

const rsh = findSheet(rosterWb, "Roster Report");
const csh = findSheet(cbmhoWb,  "CBMHO List");
const psh = findSheet(cbmhoWb,  "Callback List as Pulled");
console.log("Resolved Roster Report:", rsh?.name, "  CBMHO List:", csh?.name, "  Pulled:", psh?.name);

const rosterRows = rsh ? rawRows(rsh.sheet) : [];
const cbmhoRows  = csh ? rawRows(csh.sheet) : [];
const pulledRows = psh ? rawRows(psh.sheet) : [];

console.log("Roster rows:", rosterRows.length, "  CBMHO rows:", cbmhoRows.length, "  Pulled rows:", pulledRows.length);

const roster = parseRoster(rosterRows);
const cbmho  = parseCBMHO(cbmhoRows, pulledRows);

console.log("\n══ ROSTER PARSE ══");
console.log("vacancies:", roster.vacancies.length);
console.log("unassigned:", roster.unassigned.length);
console.log("muP:", roster.muP.length);
console.log("unconfirmed:", roster.unconfirmed.length);
console.log("warnings:", roster.warnings);
console.log("shiftMeta:", roster.shiftMeta);
if (roster.vacancies.length) {
  console.log("\nVacancies:");
  for (const v of roster.vacancies) {
    console.log(`  ${v.id.padEnd(4)} ${(v.unit||"—").padEnd(20)} Sta ${String(v.station??"-").padEnd(2)} Bat ${v.battalion??"-"} ${v.position.padEnd(22)} ${v.start}-${v.end} (${v.hours}h)${v.isUtility?" [UT]":""}${v.certReq.length?" certs="+v.certReq.join("/"):""}`);
  }
}
if (roster.unassigned.length) {
  console.log("\nUnassigned:");
  for (const p of roster.unassigned) {
    console.log(`  ${p.name.padEnd(28)} ${p.rank.padEnd(6)} sta=${p.currentStation??"-"} ${p.availStart}-${p.availEnd} (${p.availHours}h)`);
  }
}
if (roster.muP.length) {
  console.log("\nMU·P:");
  for (const m of roster.muP) console.log(`  ${m.name} (${m.rank}) sta ${m.station ?? "-"}`);
}

console.log("\n══ CBMHO PARSE ══");
console.log("callbackPre:", cbmho.callbackPre.length);
console.log("callbackPost:", cbmho.callbackPost.length);
console.log("mho:", cbmho.mho.length);
console.log("offMandatory:", cbmho.offMandatory.length);
console.log("warnings:", cbmho.warnings);
console.log("shiftMeta:", cbmho.shiftMeta);

if (cbmho.callbackPre.length) {
  console.log("\nCallback Pre-1200:");
  for (const p of cbmho.callbackPre) {
    console.log(`  #${String(p.listNumber||"").padEnd(3)} ${p.name.padEnd(28)} ${p.rank.padEnd(6)} ${p.availStart}-${p.availEnd} (${p.availHours}h)${p.certs.length?" "+p.certs.join("/"):""}`);
  }
}
if (cbmho.callbackPost.length) {
  console.log("\nCallback After-1200:");
  for (const p of cbmho.callbackPost) {
    console.log(`  #${String(p.listNumber||"").padEnd(3)} ${p.name.padEnd(28)} ${p.rank.padEnd(6)} ${p.availStart}-${p.availEnd}`);
  }
}
if (cbmho.mho.length) {
  console.log("\nMHO Group:");
  for (const p of cbmho.mho) {
    console.log(`  #${String(p.listNumber||"").padEnd(3)} ${p.name.padEnd(28)} ${p.rank.padEnd(6)}${p.certs.length?" "+p.certs.join("/"):""}`);
  }
}

if (roster.vacancies.length === 0) {
  console.log("\n[!] No vacancies parsed — engine will not run. Inspecting first 30 raw roster rows:");
  for (let i = 0; i < Math.min(30, rosterRows.length); i++) {
    console.log(`  R${String(i).padStart(3)}: ${JSON.stringify(rosterRows[i])}`);
  }
  process.exit(0);
}

const input = {
  vacancies:    roster.vacancies,
  unassigned:   roster.unassigned,
  callbackPre:  cbmho.callbackPre,
  callbackPost: cbmho.callbackPost,
  mho:          cbmho.mho,
  muP:          roster.muP,
  unconfirmed:  roster.unconfirmed,
  offMandatory: cbmho.offMandatory,
  shiftMeta:    { ...cbmho.shiftMeta, ...roster.shiftMeta },
};

const r = runEngine(input);
const flags = buildFlags({ assignments: r.assignments, input });
const stats = { ...getStats(r.assignments), highFlags: highCount(flags) };

console.log("\n══ ENGINE RESULT ══");
console.log("Stats:", stats);
console.log("\nAssignments:");
for (const a of r.assignments) {
  console.log(`  ${(a.vacancy?.unit||"—").padEnd(20)} ${(a.vacancy?.position||"—").padEnd(22)} ${a.vacancy?.start}-${a.vacancy?.end}  →  ${(a.personName||"UNSTAFFED").padEnd(28)} ${(a.rank||"-").padEnd(6)} ${a.tier.padEnd(11)} ${a.acting?"[ACTING]":""}`);
}

console.log("\nFlags:");
for (const f of flags) console.log(`  [${f.severity}] ${f.title}: ${f.body}`);
