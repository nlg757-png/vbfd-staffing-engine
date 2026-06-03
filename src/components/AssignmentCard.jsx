import { useState } from "react";
import { Check, Clock, Flag, MapPin, Pencil } from "lucide-react";
import { RankBadge, TierBadge, CertList, StatusDot } from "./Badges.jsx";
import { STATIONS } from "../engine/constants.js";

function toMinutes(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function windowStyle(vacancy) {
  const start = String(vacancy?.start || "");
  const end = String(vacancy?.end || "");
  const half = String(vacancy?.half || "").toUpperCase();
  const hours = Number(vacancy?.hours || 0);
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  const crossesMidnight = startMin != null && endMin != null && endMin <= startMin;

  if (hours >= 24 || start === end) {
    return {
      label: "24 HR",
      description: "Full shift",
      color: "#22c55e",
      background: "rgba(34,197,94,0.13)",
      block: "rgba(34,197,94,0.19)",
      border: "rgba(34,197,94,0.62)",
    };
  }

  if (
    half === "DAY" ||
    (
      startMin != null &&
      endMin != null &&
      !crossesMidnight &&
      startMin < 20 * 60 &&
      endMin <= 20 * 60
    )
  ) {
    return {
      label: "AM",
      description: "Day slot",
      color: "#facc15",
      background: "rgba(250,204,21,0.12)",
      block: "rgba(250,204,21,0.18)",
      border: "rgba(250,204,21,0.62)",
    };
  }

  if (
    half === "NIGHT" ||
    crossesMidnight ||
    (startMin != null && startMin >= 20 * 60)
  ) {
    return {
      label: "PM",
      description: "Night slot",
      color: "#60a5fa",
      background: "rgba(96,165,250,0.12)",
      block: "rgba(96,165,250,0.18)",
      border: "rgba(96,165,250,0.62)",
    };
  }

  return {
    label: "CUSTOM",
    description: "Custom slot",
    color: "#64748b",
    background: "rgba(100,116,139,0.045)",
    block: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.35)",
  };
}

function displayWindow(vacancy) {
  return `${vacancy?.start || "--:--"}-${vacancy?.end || "--:--"}`;
}

export default function AssignmentCard({ a, onConfirm, onOverride }) {
  const [expanded, setExpanded] = useState(false);
  const [overrideName, setOverrideName] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const stationName = a.vacancy?.station ? STATIONS[a.vacancy.station]?.name : null;
  const half = a.vacancy?.half;
  const isUtility = a.vacancy?.isUtility;
  const shiftColor = windowStyle(a.vacancy);
  const tint = a.confirmed ? "border-filled/40" : a.status === "unstaffed" ? "border-bd" : "border-bd";

  return (
    <article
      className={`relative overflow-hidden rounded-sm border ${tint} shadow-[0_12px_28px_rgba(0,0,0,0.22)]`}
      style={{
        background: a.confirmed
          ? "linear-gradient(90deg, rgba(34,197,94,0.11), rgba(13,17,23,0.96) 38%)"
          : `linear-gradient(90deg, ${shiftColor.background}, rgba(13,17,23,0.98) 42%)`,
        borderLeft: `7px solid ${shiftColor.color}`,
      }}
    >
      <header className="grid gap-4 border-b border-bd/80 px-5 py-4 lg:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="pt-1.5">
            <StatusDot status={a.status} acting={a.acting} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="mono text-[15px] font-semibold uppercase tracking-[0.12em] text-txt-primary">
                {a.vacancy?.unit || "-"}
              </h3>
              <TierBadge tier={a.tier} />
              {half && (
                <span className="mono rounded-sm border border-mho/40 bg-mho/10 px-1.5 py-[2px] text-[10px] uppercase tracking-[0.18em] text-mho">
                  {half} HALF - 12HR MAX
                </span>
              )}
              {isUtility && (
                <span className="mono rounded-sm border border-bd bg-bg-row px-1.5 py-[2px] text-[10px] uppercase tracking-[0.18em] text-txt-muted">
                  UTILITY - LAST
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 mono text-[11px] text-txt-muted">
              {a.vacancy?.station != null && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> Sta {String(a.vacancy.station).padStart(2, "0")}
                  {stationName ? ` - ${stationName}` : ""}
                </span>
              )}
              {a.vacancy?.battalion != null && <span>Bat {a.vacancy.battalion}</span>}
              <span>{a.vacancy?.position}</span>
            </div>
          </div>
        </div>

        <div
          className="min-w-[190px] rounded-sm border px-4 py-3 text-right"
          style={{ borderColor: shiftColor.border, background: shiftColor.block }}
        >
          <div className="mono text-[10px] uppercase tracking-[0.22em]" style={{ color: shiftColor.color }}>
            {shiftColor.description}
          </div>
          <div className="mono mt-1 text-2xl font-semibold tracking-[0.02em] text-txt-primary">
            {displayWindow(a.vacancy)}
          </div>
          <div className="mono mt-0.5 text-[11px] text-txt-muted">
            <Clock size={12} className="mr-1 inline -mt-px" />
            {a.vacancy?.hours} hr
          </div>
        </div>
      </header>

      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {a.personName ? (
            <>
              <span className="text-[16px] font-semibold text-txt-primary">{a.personName}</span>
              <RankBadge rank={a.rank} />
              <span className="mono rounded-sm border border-bd bg-bg-row px-2 py-1 text-[11px] text-txt-primary">
                {a.source}
              </span>
              <CertList certs={a.certs} />
            </>
          ) : (
            <span className="mono text-[12px] uppercase tracking-[0.18em] text-txt-muted">
              Unstaffed - {a.source}
            </span>
          )}
        </div>

        <div className="mt-3 rounded-sm border border-bd bg-black/15 px-3 py-2 text-[13px] text-txt-primary/90">
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-txt-muted">Recommended</span>
          <div className="mt-1">
            {a.personName
              ? `${a.personName} -> ${a.vacancy?.unit || "vacancy"}: Reason: position, qualification, and working-window coverage.`
              : `${a.vacancy?.unit || "Vacancy"} remains unstaffed under the active rules.`}
          </div>
        </div>

        {(a.partialCoverage || a.acting || a.flags?.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            {a.acting && (
              <span className="inline-flex items-center gap-1 text-mho">
                <Flag size={11} /> Acting Captain
              </span>
            )}
            {a.partialCoverage && (
              <span className="inline-flex items-center gap-1 text-warn">
                <Flag size={11} /> Partial coverage ({Math.round(a.coverageFraction * 100)}%)
              </span>
            )}
            {a.flags?.map((f, i) => (
              <span key={i} className="text-warn">{f}</span>
            ))}
          </div>
        )}

        {a.overrideName && (
          <div className="mt-2 mono text-[11px] text-info">
            Override {"->"} {a.overrideName}{a.overrideReason ? ` - ${a.overrideReason}` : ""}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          {a.status !== "unstaffed" && (
            <button
              onClick={() => onConfirm(a.vacancyId)}
              disabled={a.confirmed}
              className={`mono rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                a.confirmed
                  ? "cursor-default border-filled/40 bg-filled/15 text-filled"
                  : "border-bd text-txt-primary hover:border-filled/50 hover:text-filled"
              }`}
            >
              <Check size={11} className="mr-1 inline -mt-px" />
              {a.confirmed ? "Confirmed" : "Confirm"}
            </button>
          )}
          <button
            onClick={() => setExpanded((x) => !x)}
            className="mono rounded-sm border border-bd px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-txt-primary hover:border-info/50 hover:text-info"
          >
            <Pencil size={11} className="mr-1 inline -mt-px" />
            Override
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-bd pt-3">
            <input
              value={overrideName}
              onChange={(e) => setOverrideName(e.target.value)}
              placeholder="Override name (Last, First M.)"
              className="mono w-full rounded-sm border border-bd bg-bg-row px-2 py-1.5 text-[12px] text-txt-primary placeholder:text-txt-dim focus:border-info focus:outline-none"
            />
            <input
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Reason (optional)"
              className="mono w-full rounded-sm border border-bd bg-bg-row px-2 py-1.5 text-[12px] text-txt-primary placeholder:text-txt-dim focus:border-info focus:outline-none"
            />
            <button
              onClick={() => {
                onOverride(a.vacancyId, overrideName.trim(), overrideReason.trim());
                setExpanded(false);
              }}
              disabled={!overrideName.trim()}
              className="mono rounded-sm border border-info/50 bg-info/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-info hover:bg-info/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm Override
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
