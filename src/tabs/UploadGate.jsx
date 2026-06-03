import { Play, Loader2, RotateCw, Download, Printer, FileText, Share2 } from "lucide-react";
import UploadZone from "../components/UploadZone.jsx";
import Diagnostics from "../components/Diagnostics.jsx";
import RulesPanel from "../components/RulesPanel.jsx";

export default function UploadGate({
  rosterFile, cbmhoFile,
  rosterError, cbmhoError,
  onRoster, onCBMHO,
  onRun, running, hasRun, fatal,
  diagnostics,
  onExportCSV, onExportPDF, onExportResults, onPrint,
}) {
  const ready = !!rosterFile && !!cbmhoFile && !rosterError && !cbmhoError;

  return (
    <div className="mx-auto max-w-[1200px] px-7 py-6 space-y-5">
      <section>
        <h2 className="mono text-[11px] tracking-[0.22em] uppercase text-txt-muted mb-3">
          Daily Workbooks
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <UploadZone
            label="TeleStaff Roster Report"
            hint="Sheet: Roster Report"
            file={rosterFile}
            error={rosterError}
            onFile={onRoster}
          />
          <UploadZone
            label="CBMHO Spreadsheet"
            hint="Sheets: CBMHO List · Callback List as Pulled · Do Not Touch"
            file={cbmhoFile}
            error={cbmhoError}
            onFile={onCBMHO}
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRun}
          disabled={!ready || running}
          className={`mono text-[11px] tracking-[0.22em] uppercase px-4 py-2.5 rounded-sm border transition-colors ${
            !ready ? "border-bd bg-bg-panel text-txt-muted cursor-not-allowed"
                   : running ? "border-info/50 bg-info/10 text-info cursor-wait"
                             : "border-info/50 bg-info/15 text-info hover:bg-info/25"
          }`}
        >
          {running
            ? <><Loader2 size={13} className="inline -mt-px mr-2 animate-spin" />Processing…</>
            : hasRun
              ? <><RotateCw size={13} className="inline -mt-px mr-2" />Re-Run Engine</>
              : <><Play size={13} className="inline -mt-px mr-2" />Run Staffing Engine</>}
        </button>

        {hasRun && (
          <>
            <button
              onClick={onExportResults}
              className="mono text-[11px] tracking-[0.18em] uppercase px-3 py-2.5 rounded-sm border border-filled/40 bg-filled/10 hover:bg-filled/20 text-filled"
            >
              <Share2 size={12} className="inline -mt-px mr-1.5" />Results Page
            </button>
            <button
              onClick={onExportCSV}
              className="mono text-[11px] tracking-[0.18em] uppercase px-3 py-2.5 rounded-sm border border-bd hover:border-filled/40 hover:text-filled text-txt-primary"
            >
              <Download size={12} className="inline -mt-px mr-1.5" />CSV
            </button>
            <button
              onClick={onExportPDF}
              className="mono text-[11px] tracking-[0.18em] uppercase px-3 py-2.5 rounded-sm border border-bd hover:border-alert/40 hover:text-alert text-txt-primary"
            >
              <FileText size={12} className="inline -mt-px mr-1.5" />PDF
            </button>
            <button
              onClick={onPrint}
              className="mono text-[11px] tracking-[0.18em] uppercase px-3 py-2.5 rounded-sm border border-bd hover:border-info/40 hover:text-info text-txt-primary"
            >
              <Printer size={12} className="inline -mt-px mr-1.5" />Print
            </button>
          </>
        )}

        {fatal && <span className="mono text-[11px] text-alert">{fatal}</span>}
      </section>

      {diagnostics && <Diagnostics diag={diagnostics} />}

      <RulesPanel />
    </div>
  );
}
