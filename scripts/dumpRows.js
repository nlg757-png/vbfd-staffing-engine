import fs from "node:fs";
import * as XLSX from "xlsx";

const file = process.argv[2];
const sheetName = process.argv[3];
const limit = parseInt(process.argv[4] || "60", 10);

const wb = XLSX.read(fs.readFileSync(file));
const target = sheetName.trim().toLowerCase();
const name = wb.SheetNames.find((n) => n.trim().toLowerCase() === target);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {
  header: 1, defval: "", raw: false, blankrows: false,
});

console.log(`\n${name} — ${rows.length} rows. Showing first ${Math.min(limit, rows.length)}:\n`);
for (let i = 0; i < Math.min(limit, rows.length); i++) {
  const trimmed = rows[i].map((c) => (c == null ? "" : String(c)));
  // truncate empties at the end
  while (trimmed.length && trimmed[trimmed.length - 1] === "") trimmed.pop();
  console.log(`R${String(i).padStart(3)}: ${JSON.stringify(trimmed)}`);
}
