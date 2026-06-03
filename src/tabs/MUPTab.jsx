import { RankBadge, CertList } from "../components/Badges.jsx";
import { AlertTriangle } from "lucide-react";

export default function MUPTab({ muP = [] }) {
  if (!muP.length) {
    return (
      <div className="mx-auto max-w-[1200px] px-7 py-10 text-center">
        <p className="mono text-[12px] tracking-[0.18em] uppercase text-txt-muted">
          No MU·P alerts on this roster.
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[1200px] px-7 py-5 space-y-2">
      {muP.map((m) => (
        <div key={m.id} className="flex items-start gap-3 rounded-sm border border-warn/40 bg-warn/[0.06] px-4 py-3">
          <AlertTriangle size={16} className="text-warn mt-[3px] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-txt-primary font-medium">{m.name}</span>
              <RankBadge rank={m.rank} />
              <span className="mono text-[11px] text-txt-muted">
                Sta {m.station ?? "—"}{m.unit ? ` · ${m.unit}` : ""}
              </span>
            </div>
            <CertList certs={m.certs} />
            <div className="text-[12px] text-txt-primary/80 mt-1">
              MU·P may create a hidden vacancy or specialty gap. Confirm staffing impact.
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
