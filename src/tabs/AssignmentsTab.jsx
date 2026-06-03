import AssignmentCard from "../components/AssignmentCard.jsx";

function countByWindow(assignments) {
  return assignments.reduce((acc, a) => {
    const start = String(a.vacancy?.start || "");
    const end = String(a.vacancy?.end || "");
    const hours = Number(a.vacancy?.hours || 0);
    const half = String(a.vacancy?.half || "").toUpperCase();
    const startHour = Number(start.slice(0, 2));
    const endHour = Number(end.slice(0, 2));
    if (hours >= 24 || start === end) acc.full += 1;
    else if (half === "DAY" || (!Number.isNaN(startHour) && !Number.isNaN(endHour) && startHour < 20 && endHour <= 20 && endHour > startHour)) acc.day += 1;
    else acc.night += 1;
    return acc;
  }, { day: 0, night: 0, full: 0 });
}

function ShiftKeyCard({ label, time, count, color, background }) {
  return (
    <div className="rounded-sm border px-4 py-3" style={{ borderColor: color, background }}>
      <div className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color }}>{label}</div>
      <div className="mono mt-1 text-xl font-semibold text-txt-primary">{time}</div>
      <div className="mono mt-1 text-[11px] text-txt-muted">{count} assignment{count === 1 ? "" : "s"}</div>
    </div>
  );
}

export default function AssignmentsTab({ assignments, onConfirm, onOverride }) {
  if (!assignments?.length) {
    return (
      <div className="mx-auto max-w-[1200px] px-7 py-10 text-center">
        <p className="mono text-[12px] uppercase tracking-[0.18em] text-txt-muted">
          No assignments yet - upload roster + CBMHO and run the engine.
        </p>
      </div>
    );
  }

  const counts = countByWindow(assignments);

  return (
    <div className="mx-auto max-w-[1200px] px-7 py-5">
      <section className="mb-4 rounded-sm border border-bd bg-bg-panel p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-txt-muted">Assignment Dashboard</div>
            <h2 className="mt-1 text-xl font-semibold text-txt-primary">Staffing moves by actual working time</h2>
          </div>
          <div className="mono text-[11px] uppercase tracking-[0.16em] text-txt-muted">
            Yellow = AM / Blue = PM / Green = 24 HR
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <ShiftKeyCard
            label="AM work"
            time="08:00-20:00"
            count={counts.day}
            color="#facc15"
            background="rgba(250,204,21,0.11)"
          />
          <ShiftKeyCard
            label="PM work"
            time="20:00-08:00"
            count={counts.night}
            color="#60a5fa"
            background="rgba(96,165,250,0.11)"
          />
          <ShiftKeyCard
            label="Full shift"
            time="24 hours"
            count={counts.full}
            color="#22c55e"
            background="rgba(34,197,94,0.11)"
          />
        </div>
      </section>

      <div className="space-y-3">
        {assignments.map((a) => (
          <AssignmentCard
            key={a.vacancyId}
            a={a}
            onConfirm={onConfirm}
            onOverride={onOverride}
          />
        ))}
      </div>
    </div>
  );
}
