export default function Footer({ shiftDate, activeShift, mhoGroup, generatedAt }) {
  return (
    <footer className="mt-10 border-t border-bd bg-bg-panel">
      <div className="mx-auto max-w-[1200px] px-7 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="mono text-[11px] tracking-[0.16em] text-txt-muted uppercase">
          {shiftDate || "—"} · {activeShift ? `Shift ${activeShift}` : "no shift"} · MHO {mhoGroup || "—"}
        </div>
        <div className="mono text-[11px] tracking-[0.16em] text-txt-muted uppercase">
          {generatedAt ? `Generated ${generatedAt}` : "Engine not yet run"}
        </div>
        <div className="mono text-[10px] tracking-[0.22em] text-alert/70 uppercase">
          Confidential · Internal Use
        </div>
      </div>
    </footer>
  );
}
