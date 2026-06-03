// Session export — CSV + printable HTML + PDF.

import { jsPDF }   from "jspdf";
import autoTable   from "jspdf-autotable";

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildCSV({ shiftDate, activeShift, mhoGroup, generatedAt, assignments }) {
  const head = [
    "Vacancy", "Unit", "Station", "Battalion", "Position", "Window", "Hours",
    "Assignee", "Rank", "Tier", "Source", "Acting", "Confirmed",
    "OverrideName", "OverrideReason", "Flags", "Note",
  ];
  const lines = [head.join(",")];
  for (const a of assignments) {
    lines.push([
      a.vacancyId,
      a.vacancy?.unit || "",
      a.vacancy?.station ?? "",
      a.vacancy?.battalion ?? "",
      a.vacancy?.position || "",
      `${a.vacancy?.start || ""}-${a.vacancy?.end || ""}`,
      a.vacancy?.hours ?? "",
      a.personName || "",
      a.rank || "",
      a.tier || "",
      a.source || "",
      a.acting ? "ACTING" : "",
      a.confirmed ? "YES" : "",
      a.overrideName || "",
      a.overrideReason || "",
      (a.flags || []).join("; "),
      a.note || "",
    ].map(csvEscape).join(","));
  }
  const meta = [
    `# VBFD Staffing Session`,
    `# Shift Date: ${shiftDate || "—"}`,
    `# Active Shift: ${activeShift || "—"}`,
    `# MHO Group: ${mhoGroup || "—"}`,
    `# Generated: ${generatedAt}`,
    `# CONFIDENTIAL: INTERNAL USE`,
    "",
  ].join("\n");
  return meta + lines.join("\n") + "\n";
}

export function downloadCSV(payload) {
  const text = buildCSV(payload);
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `vbfd-staffing-${safeSlug(payload.shiftDate)}.csv`);
}

function safeSlug(value) {
  const slug = String(value || "session").replace(/\D/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug || "session";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function printableHTML({ shiftDate, activeShift, mhoGroup, generatedAt, assignments }) {
  const rows = assignments.map((a) => `
    <tr>
      <td>${a.vacancy?.unit || ""}</td>
      <td>${a.vacancy?.position || ""}</td>
      <td>${a.vacancy?.start || ""}–${a.vacancy?.end || ""}</td>
      <td>${a.personName || "—"}</td>
      <td>${a.rank || ""}</td>
      <td>${a.tier || ""}</td>
      <td>${a.acting ? "ACTING" : ""}</td>
      <td>${a.confirmed ? "✓" : ""}</td>
      <td>${a.overrideName || ""}</td>
    </tr>`).join("");

  return `<!doctype html>
<html><head>
<meta charset="utf-8"><title>VBFD Staffing — ${shiftDate || ""} ${activeShift || ""}</title>
<style>
  body { font: 12px/1.4 "IBM Plex Mono", ui-monospace, monospace; color: #111; padding: 24px; }
  h1   { font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 4px; }
  .meta { color: #555; font-size: 11px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border-bottom: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #555; }
  .conf { margin-top: 24px; font-size: 10px; color: #b00; letter-spacing: 0.18em; text-transform: uppercase; }
</style>
</head><body>
<h1>VBFD · Staffing Session</h1>
<div class="meta">${shiftDate || "—"} · Shift ${activeShift || "—"} · MHO ${mhoGroup || "—"} · Generated ${generatedAt}</div>
<table>
  <thead><tr><th>Unit</th><th>Position</th><th>Window</th><th>Assignee</th><th>Rank</th><th>Tier</th><th>Acting</th><th>Conf</th><th>Override</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="conf">Confidential · Internal Use</div>
</body></html>`;
}

export function resultsHTML({ shiftDate, activeShift, mhoGroup, generatedAt, assignments, flags = [] }) {
  const filled = assignments.filter((a) => a.status !== "unstaffed").length;
  const unstaffed = assignments.length - filled;
  const mhoUsed = assignments.filter((a) => a.tier === "MHO").length;
  const callbackUsed = assignments.filter((a) => a.tier === "CALLBACK").length;
  const unassignedUsed = assignments.filter((a) => a.tier === "UNASSIGNED").length;
  const acting = assignments.filter((a) => a.acting).length;

  const rows = assignments.map((a) => {
    const v = a.vacancy || {};
    const move = a.status === "unstaffed"
      ? "UNSTAFFED"
      : `Sta ${a.currentStation ?? a.homeStation ?? "?"} → Sta ${v.station ?? "?"}`;
    const statusClass = a.status === "unstaffed" ? "unstaffed" : a.acting ? "acting" : "filled";
    const notes = [
      a.partialCoverage ? `Partial coverage: ${Math.round((a.coverageFraction || 0) * 100)}%` : "",
      a.acting ? "Acting Captain" : "",
      a.overrideName ? `Override: ${a.overrideName}${a.overrideReason ? ` (${a.overrideReason})` : ""}` : "",
      ...(a.flags || []),
    ].filter(Boolean).join("; ");
    return `
      <tr class="${statusClass}">
        <td>
          <strong>${escapeHTML(v.unit || "—")}</strong>
          <span>Sta ${escapeHTML(v.station ?? "—")} · Bat ${escapeHTML(v.battalion ?? "—")}</span>
        </td>
        <td>${escapeHTML(v.position || "—")}</td>
        <td>${escapeHTML(v.start || "")}–${escapeHTML(v.end || "")}<span>${escapeHTML(v.hours ?? "")} hr</span></td>
        <td>
          <strong>${escapeHTML(a.personName || "UNSTAFFED")}</strong>
          <span>${escapeHTML(a.rank || "")} ${a.acting ? "· ACTING" : ""}</span>
        </td>
        <td>${escapeHTML(a.source || "")}<span>${escapeHTML(a.tier || "")}</span></td>
        <td>${escapeHTML(move)}</td>
        <td>${escapeHTML(notes || "—")}</td>
      </tr>`;
  }).join("");

  const flagRows = flags.length
    ? flags.map((f) => `<li class="${String(f.severity || "").toLowerCase()}"><strong>${escapeHTML(f.severity)}</strong> ${escapeHTML(f.title)}<span>${escapeHTML(f.body)}</span></li>`).join("")
    : `<li><strong>NONE</strong> No policy flags generated for this run.</li>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VBFD Staffing Results ${escapeHTML(shiftDate || "")}</title>
<style>
  :root { color-scheme: dark; --bg:#080c10; --panel:#0d1117; --row:#0a0f14; --border:#1a2030; --text:#e2e8f0; --muted:#94a3b8; --green:#22c55e; --blue:#60a5fa; --orange:#f97316; --red:#dc2626; --amber:#d97706; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:14px/1.45 Arial, Helvetica, sans-serif; }
  .wrap { max-width:1180px; margin:0 auto; padding:28px; }
  header { border-bottom:1px solid var(--border); padding-bottom:18px; margin-bottom:18px; }
  h1 { margin:0; font-size:22px; letter-spacing:.08em; text-transform:uppercase; }
  .meta { color:var(--muted); margin-top:6px; font-family:Consolas, monospace; }
  .conf { color:#fca5a5; letter-spacing:.16em; text-transform:uppercase; font:11px Consolas, monospace; margin-top:10px; }
  .stats { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; margin:18px 0; }
  .stat { background:var(--panel); border:1px solid var(--border); padding:12px; }
  .stat b { display:block; font:20px Consolas, monospace; }
  .stat span { color:var(--muted); font:10px Consolas, monospace; letter-spacing:.16em; text-transform:uppercase; }
  table { width:100%; border-collapse:collapse; background:var(--panel); border:1px solid var(--border); }
  th { background:var(--row); color:var(--muted); font:10px Consolas, monospace; letter-spacing:.14em; text-transform:uppercase; text-align:left; padding:10px; border-bottom:1px solid var(--border); }
  td { padding:10px; border-bottom:1px solid var(--border); vertical-align:top; }
  td span { display:block; color:var(--muted); font:11px Consolas, monospace; margin-top:2px; }
  tr.filled { border-left:5px solid var(--green); }
  tr.acting { border-left:5px solid var(--orange); }
  tr.unstaffed { border-left:5px solid var(--red); color:#fecaca; }
  h2 { margin:24px 0 10px; font-size:14px; letter-spacing:.14em; text-transform:uppercase; }
  ul { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
  li { background:var(--panel); border:1px solid var(--border); border-left:5px solid var(--blue); padding:10px; }
  li.high { border-left-color:var(--red); }
  li.medium { border-left-color:var(--amber); }
  li.low { border-left-color:var(--blue); }
  li span { display:block; color:var(--muted); margin-top:3px; }
  footer { margin-top:24px; color:var(--muted); font:11px Consolas, monospace; }
  @media print { body { background:white; color:#111; } .stat, table, li { break-inside:avoid; } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>VBFD Staffing Assignment Results</h1>
    <div class="meta">Date ${escapeHTML(shiftDate || "—")} · Shift ${escapeHTML(activeShift || "—")} · MHO Group ${escapeHTML(mhoGroup || "—")} · Generated ${escapeHTML(generatedAt || new Date().toLocaleString())}</div>
    <div class="conf">Confidential · Internal Use · Decision Support Output</div>
  </header>
  <section class="stats">
    <div class="stat"><b>${assignments.length}</b><span>Vacancies</span></div>
    <div class="stat"><b>${filled}</b><span>Filled</span></div>
    <div class="stat"><b>${unstaffed}</b><span>Unstaffed</span></div>
    <div class="stat"><b>${unassignedUsed}</b><span>Unassigned</span></div>
    <div class="stat"><b>${callbackUsed}</b><span>Callback</span></div>
    <div class="stat"><b>${mhoUsed}</b><span>MHO</span></div>
  </section>
  <h2>Assignments And Moves</h2>
  <table>
    <thead><tr><th>Vacancy</th><th>Position</th><th>Window</th><th>Recommended Member</th><th>Source</th><th>Move</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Policy Flags</h2>
  <ul>${flagRows}</ul>
  <footer>Generated by VBFD Staffing Assignment Engine. Staffing officer retains final authority over every assignment.</footer>
</div>
</body>
</html>`;
}

export function downloadResultsHTML(payload) {
  const html = resultsHTML(payload);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `vbfd-staffing-results-${safeSlug(payload.shiftDate)}.html`);
}

export function openPrintable(payload) {
  const html = printableHTML(payload);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => frame.remove(), 5000);
    }
  };
  frame.srcdoc = html;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PDF export — formatted shift report (jsPDF + autoTable).
// ─────────────────────────────────────────────────────────────────────────────

export function buildPDF({ shiftDate, activeShift, mhoGroup, generatedAt, assignments, flags = [] }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("VBFD · Staffing Assignment Report", 40, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(
    `${shiftDate || "—"}   ·   Shift ${activeShift || "—"}   ·   MHO Group ${mhoGroup || "—"}   ·   Generated ${generatedAt || ""}`,
    40, 64
  );
  doc.setTextColor(180, 28, 28);
  doc.setFontSize(8);
  doc.text("CONFIDENTIAL · INTERNAL USE ONLY", 40, 78);
  doc.setTextColor(0);

  // ── Assignments table ────────────────────────────────────────────────────
  const body = assignments.map((a) => [
    a.vacancy?.unit || "—",
    a.vacancy?.position || "—",
    `${a.vacancy?.start || ""}–${a.vacancy?.end || ""}`,
    `${a.vacancy?.hours ?? ""}h`,
    a.personName || (a.status === "unstaffed" ? "UNSTAFFED" : "—"),
    a.rank || "",
    a.tier || "",
    a.acting ? "ACTING" : "",
    a.confirmed ? "✓" : "",
    a.overrideName ? `OVR: ${a.overrideName}\n${a.overrideReason || ""}` : "",
  ]);

  autoTable(doc, {
    startY: 96,
    head: [["Unit", "Position", "Window", "Hrs", "Assignee", "Rank", "Tier", "Acting", "Conf", "Override"]],
    body,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [40, 40, 40], textColor: 240, fontStyle: "bold", fontSize: 8, halign: "left" },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 88 },
      2: { cellWidth: 64 },
      3: { cellWidth: 28 },
      4: { cellWidth: 110 },
      5: { cellWidth: 38 },
      6: { cellWidth: 56 },
      7: { cellWidth: 44 },
      8: { cellWidth: 28 },
      9: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const row = assignments[data.row.index];
      if (!row) return;
      if (row.status === "unstaffed") data.cell.styles.textColor = [180, 28, 28];
      else if (row.acting)            data.cell.styles.textColor = [196, 96, 24];
      else if (row.confirmed)         data.cell.styles.textColor = [32, 120, 60];
    },
  });

  // ── Flags table (if present) ─────────────────────────────────────────────
  if (flags.length > 0) {
    const yAfter = doc.lastAutoTable?.finalY || 200;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Policy Flags", 40, yAfter + 24);

    autoTable(doc, {
      startY: yAfter + 30,
      head: [["Sev", "Title", "Detail"]],
      body: flags.map((f) => [f.severity, f.title, f.body]),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 4, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [40, 40, 40], textColor: 240, fontStyle: "bold", fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 160 },
        2: { cellWidth: "auto" },
      },
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 0) return;
        const sev = flags[data.row.index]?.severity;
        if (sev === "HIGH")        data.cell.styles.textColor = [180, 28, 28];
        else if (sev === "MEDIUM") data.cell.styles.textColor = [196, 96, 24];
        else                       data.cell.styles.textColor = [80, 80, 80];
      },
    });
  }

  // ── Officer signature block ──────────────────────────────────────────────
  const yEnd = (doc.lastAutoTable?.finalY || 200) + 40;
  doc.setDrawColor(120);
  doc.setLineWidth(0.5);
  doc.line(40, yEnd, 280, yEnd);
  doc.line(pageW - 240, yEnd, pageW - 40, yEnd);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("Staffing Officer Signature", 40, yEnd + 12);
  doc.text("Date / Time", pageW - 240, yEnd + 12);
  doc.setTextColor(0);

  return doc;
}

export function downloadPDF(payload) {
  try {
    const doc = buildPDF(payload);
    const blob = doc.output("blob");
    downloadBlob(blob, `vbfd-staffing-${safeSlug(payload.shiftDate)}.pdf`);
  } catch (err) {
    console.error(err);
    const html = printableHTML(payload);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `vbfd-staffing-${safeSlug(payload.shiftDate)}-printable.html`);
    window.alert("PDF export hit a browser issue, so a printable HTML report was downloaded instead.");
  }
}
