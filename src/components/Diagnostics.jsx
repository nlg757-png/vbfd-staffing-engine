import { AlertTriangle, Info } from "lucide-react";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-bd/60 last:border-0 py-1.5">
      <span className="mono text-[11px] tracking-[0.14em] uppercase text-txt-muted">{label}</span>
      <span className="mono text-[12px] text-txt-primary">{value ?? "—"}</span>
    </div>
  );
}

export default function Diagnostics({ diag }) {
  if (!diag) return null;
  const warnings = diag.warnings || [];

  return (
    <section className="rounded-sm border border-bd bg-bg-panel p-5">
      <div className="flex items-center gap-2 mb-3">
        <Info size={14} className="text-info" />
        <h2 className="mono text-[11px] tracking-[0.22em] uppercase text-txt-primary">
          Parse Diagnostics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div>
          <Row label="Roster file"           value={diag.rosterFilename} />
          <Row label="Roster sheets"         value={(diag.rosterSheets || []).join(", ") || "—"} />
          <Row label="Roster rows"           value={diag.rosterRowCount} />
          <Row label="Vacancies parsed"      value={diag.vacancies} />
          <Row label="Unassigned parsed"     value={diag.unassigned} />
          <Row label="MU·P alerts"           value={diag.muP} />
        </div>
        <div>
          <Row label="CBMHO file"            value={diag.cbmhoFilename} />
          <Row label="CBMHO sheets"          value={(diag.cbmhoSheets || []).join(", ") || "—"} />
          <Row label="CBMHO rows"            value={diag.cbmhoRowCount} />
          <Row label="Pre-1200 callback"     value={diag.callbackPre} />
          <Row label="After-1200 callback"   value={diag.callbackPost} />
          <Row label="MHO members"           value={diag.mho} />
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 border-t border-bd pt-3 space-y-1.5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px] text-warn">
              <AlertTriangle size={13} className="mt-[3px] shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
