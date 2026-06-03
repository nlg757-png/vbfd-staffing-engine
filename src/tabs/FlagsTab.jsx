import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

const ICON = { HIGH: AlertOctagon, MEDIUM: AlertTriangle, LOW: Info };
const STYLE = {
  HIGH:   "border-alert/40 bg-alert/[0.06] text-alert",
  MEDIUM: "border-warn/40  bg-warn/[0.06]  text-warn",
  LOW:    "border-info/40  bg-info/[0.06]  text-info",
};

export default function FlagsTab({ flags = [] }) {
  if (!flags.length) {
    return (
      <div className="mx-auto max-w-[1200px] px-7 py-10 text-center">
        <p className="mono text-[12px] tracking-[0.18em] uppercase text-txt-muted">No flags raised.</p>
      </div>
    );
  }
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = [...flags].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <div className="mx-auto max-w-[1200px] px-7 py-5 space-y-2">
      {sorted.map((f) => {
        const Icon = ICON[f.severity] || Info;
        return (
          <div key={f.id} className={`flex items-start gap-3 rounded-sm border ${STYLE[f.severity]} px-4 py-3`}>
            <Icon size={16} className="mt-[3px] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="mono text-[10px] tracking-[0.22em] uppercase">{f.severity}</span>
                <span className="text-[14px] text-txt-primary font-medium">{f.title}</span>
              </div>
              <div className="text-[13px] text-txt-primary/80 mt-0.5">{f.body}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
