function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-sm border border-bd bg-bg-panel px-4 py-3">
      <div className="mono text-[10px] tracking-[0.18em] uppercase text-txt-muted">{label}</div>
      <div className={`mono text-2xl mt-1 ${accent || "text-txt-primary"}`}>{value}</div>
    </div>
  );
}

export default function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="mx-auto max-w-[1200px] px-7 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard label="Vacancies"     value={stats.total} />
        <StatCard label="Filled"        value={`${stats.filled}/${stats.total}`} accent="text-filled" />
        <StatCard label="MHO Used"      value={stats.mhoUsed}      accent="text-mho" />
        <StatCard label="Acting Capt"   value={stats.actingCapt}   accent="text-warn" />
        <StatCard label="Unstaffed"     value={stats.unstaffed}    accent={stats.unstaffed ? "text-alert" : "text-txt-muted"} />
        <StatCard label="High Flags"    value={stats.highFlags ?? 0} accent={stats.highFlags ? "text-alert" : "text-txt-muted"} />
      </div>
    </div>
  );
}
