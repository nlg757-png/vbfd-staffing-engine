import { Flame } from "lucide-react";

export default function TopNav({ shiftDate, activeShift, mhoGroup }) {
  const Stat = ({ label, value }) => (
    <div className="flex flex-col items-end leading-tight">
      <span className="mono text-[10px] uppercase tracking-[0.18em] text-txt-muted">{label}</span>
      <span className="mono text-sm text-txt-primary">{value || "-"}</span>
    </div>
  );

  return (
    <header className="h-[52px] border-b border-bd bg-bg-panel">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-alert/15 text-alert">
            <Flame size={16} strokeWidth={2.25} />
          </div>
          <span className="mono text-[13px] tracking-[0.22em] text-txt-primary">
            VBFD - STAFFING ENGINE
          </span>
        </div>
        <div className="flex items-center gap-7">
          <Stat label="Shift Date" value={shiftDate} />
          <Stat label="Active Shift" value={activeShift} />
          <Stat label="MHO Group" value={mhoGroup} />
        </div>
      </div>
    </header>
  );
}
