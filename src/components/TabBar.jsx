const TABS = [
  { key: "assignments", label: "Assignments" },
  { key: "mho",         label: "MHO Group" },
  { key: "flags",       label: "Flags" },
  { key: "mup",         label: "MU·P Alerts" },
];

export default function TabBar({ active, onChange, counts = {} }) {
  return (
    <div className="mx-auto max-w-[1200px] px-7 mt-5 border-b border-bd">
      <nav className="flex gap-1">
        {TABS.map((t) => {
          const isActive = active === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`mono text-[11px] tracking-[0.18em] uppercase px-4 py-2.5 -mb-px border-b-2 transition-colors ${
                isActive
                  ? "border-info text-info"
                  : "border-transparent text-txt-muted hover:text-txt-primary"
              }`}
            >
              {t.label}
              {typeof count === "number" && count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-sm text-[10px] ${
                  isActive ? "bg-info/15" : "bg-bg-row text-txt-muted"
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
