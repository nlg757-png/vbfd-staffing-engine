// Reusable badge primitives.

const RANK_STYLE = {
  FCPT:  "bg-[#0b1e3a] text-[#60a5fa]",
  MFF:   "bg-[#1c1600] text-[#fbbf24]",
  MFFII: "bg-[#1c1600] text-[#fbbf24]",
  FMFF:  "bg-[#1c1600] text-[#fbbf24]",
  FFII:  "bg-[#111111] text-[#4b5563]",
  FFI:   "bg-[#111111] text-[#4b5563]",
};

const TIER_STYLE = {
  MHO:        "bg-mho/15 text-mho border border-mho/30",
  CALLBACK:   "bg-info/15 text-info border border-info/30",
  UNASSIGNED: "bg-filled/15 text-filled border border-filled/30",
  UNSTAFFED:  "bg-bg-row text-txt-muted border border-bd",
};

const SPECIALTY = new Set([
  "DPO","LO","TD","TO","TECH","HZM","RSQ","MO1","MO2","MO6","MO12","FRS","TNK","PWC",
]);

export function RankBadge({ rank }) {
  if (!rank) return null;
  return (
    <span className={`mono text-[10px] tracking-[0.18em] uppercase rounded-sm px-1.5 py-[2px] ${RANK_STYLE[rank] || "bg-bg-row text-txt-muted"}`}>
      {rank}
    </span>
  );
}

export function TierBadge({ tier }) {
  if (!tier) return null;
  return (
    <span className={`mono text-[10px] tracking-[0.22em] uppercase rounded-sm px-2 py-[3px] ${TIER_STYLE[tier] || TIER_STYLE.UNSTAFFED}`}>
      {tier}
    </span>
  );
}

export function CertPill({ code }) {
  const isSpecialty = SPECIALTY.has(code);
  const style = isSpecialty
    ? "bg-[#152415] border border-[#22c55e33] text-[#86efac]"
    : "bg-[#111111] border border-[#1e1e1e] text-[#3a3a3a]";
  return (
    <span className={`mono text-[10px] tracking-[0.12em] uppercase rounded-sm px-1.5 py-[2px] ${style}`}>
      {code}
    </span>
  );
}

export function CertList({ certs }) {
  if (!certs?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {certs.map((c) => <CertPill key={c} code={c} />)}
    </div>
  );
}

export function StatusDot({ status, acting }) {
  const color = status === "unstaffed" ? "bg-txt-muted"
              : acting                 ? "bg-mho pulse-dot"
              :                          "bg-filled pulse-dot";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}
