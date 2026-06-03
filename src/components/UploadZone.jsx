import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";

export default function UploadZone({ label, hint, file, status, error, onFile }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleFile(f) {
    if (!f) return;
    if (!/\.xlsx?$/i.test(f.name)) {
      onFile(null, "File must be an .xlsx workbook");
      return;
    }
    onFile(f, null);
  }

  const ok = !!file && !error;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-sm border ${
        drag ? "border-info bg-info/5" :
        ok   ? "border-filled/40 bg-filled/5" :
        error ? "border-alert/50 bg-alert/5" :
                "border-bd bg-bg-panel hover:border-info/40"
      } px-5 py-6 transition-colors`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-sm ${
          ok ? "bg-filled/15 text-filled" :
          error ? "bg-alert/15 text-alert" :
                  "bg-bg-row text-txt-muted"
        }`}>
          {ok ? <CheckCircle2 size={20} /> :
           error ? <XCircle size={20} /> :
           <Upload size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="mono text-[11px] tracking-[0.18em] uppercase text-txt-muted">{label}</div>
          <div className="text-[14px] text-txt-primary mt-0.5 truncate">
            {file ? file.name : "Drop .xlsx here or click to browse"}
          </div>
          <div className="mono text-[11px] text-txt-muted mt-1">
            {error ? <span className="text-alert">{error}</span>
                   : status ? status
                   : hint}
          </div>
        </div>
        {file && (
          <FileSpreadsheet size={18} className="shrink-0 text-txt-muted" />
        )}
      </div>
    </div>
  );
}
