import { RankBadge, CertList } from "../components/Badges.jsx";

export default function MHOTab({ mho = [], assignments = [] }) {
  const usedById = new Map(assignments.filter((a) => a.tier === "MHO").map((a) => [a.personId, a]));

  const counts = {
    assigned:  [...usedById.values()].length,
    excused:   mho.filter((m) => m.available === false).length,
    flagged:   0,
    available: mho.filter((m) => !usedById.has(m.id) && m.available !== false).length,
  };

  if (!mho.length) {
    return (
      <div className="mx-auto max-w-[1200px] px-7 py-10 text-center">
        <p className="mono text-[12px] tracking-[0.18em] uppercase text-txt-muted">
          No MHO members loaded.
        </p>
      </div>
    );
  }

  const Pill = ({ label, value, accent }) => (
    <div className="rounded-sm border border-bd bg-bg-panel px-3 py-2">
      <div className="mono text-[10px] tracking-[0.18em] uppercase text-txt-muted">{label}</div>
      <div className={`mono text-lg ${accent || "text-txt-primary"}`}>{value}</div>
    </div>
  );

  const actingAssigned = [...usedById.values()].filter((a) => a.acting);

  return (
    <div className="mx-auto max-w-[1200px] px-7 py-5 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Pill label="Assigned"  value={counts.assigned}  accent="text-mhoG" />
        <Pill label="Excused"   value={counts.excused}   accent="text-txt-muted" />
        <Pill label="Flagged"   value={counts.flagged}   accent="text-warn" />
        <Pill label="Available" value={counts.available} accent="text-filled" />
      </div>

      <div className="rounded-sm border border-bd bg-bg-panel overflow-hidden">
        <div className="grid grid-cols-[40px_1.5fr_70px_2fr_80px_120px] mono text-[10px] tracking-[0.18em] uppercase text-txt-muted bg-bg-row border-b border-bd px-3 py-2">
          <div>#</div><div>Name</div><div>Rank</div><div>Certs</div><div>Sta</div><div>Status</div>
        </div>
        {mho.map((m) => {
          const used = usedById.get(m.id);
          const rowClass = used ? "bg-filled/[0.05]"
                         : m.available === false ? "opacity-50"
                         : "";
          return (
            <div key={m.id}
                 className={`grid grid-cols-[40px_1.5fr_70px_2fr_80px_120px] items-center px-3 py-2 border-b border-bd/60 last:border-0 ${rowClass}`}>
              <div className="mono text-[12px] text-txt-muted">{m.listNumber || ""}</div>
              <div className="text-[13px] text-txt-primary truncate">{m.name}</div>
              <div><RankBadge rank={m.rank} /></div>
              <div><CertList certs={m.certs} /></div>
              <div className="mono text-[11px] text-txt-muted">{m.currentStation ?? ""}</div>
              <div className="mono text-[10px] tracking-[0.18em] uppercase">
                {used
                  ? <span className="text-filled">{used.vacancy?.unit || "Assigned"}</span>
                  : m.available === false
                    ? <span className="text-txt-muted">{m.unavailReason || "Excused"}</span>
                    : <span className="text-txt-muted">Available</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-sm border border-bd bg-bg-panel px-4 py-3">
        <div className="mono text-[11px] tracking-[0.18em] uppercase text-txt-muted">Captain Exhaustion Narrative</div>
        <div className="mt-1 text-[13px] text-txt-primary">
          {actingAssigned.length > 0
            ? `${actingAssigned.length} acting captain assignment${actingAssigned.length === 1 ? "" : "s"} triggered after true captains were exhausted on the active list: ${actingAssigned.map((a) => `${a.personName} → ${a.vacancy?.unit}`).join("; ")}.`
            : "No acting captain sequence was triggered in this run."}
        </div>
      </div>
    </div>
  );
}
