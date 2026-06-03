import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";

function Section({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h3 className="mono text-[10px] tracking-[0.22em] uppercase text-txt-muted">
        {title}
      </h3>
      <div className="text-[13px] leading-relaxed text-txt-primary/90 space-y-1">
        {children}
      </div>
    </div>
  );
}

function Pill({ tone = "neutral", children }) {
  const styles = {
    neutral: "border-bd text-txt-primary/80",
    info:    "border-info/40 text-info",
    good:    "border-filled/40 text-filled",
    warn:    "border-mho/40 text-mho",
    bad:     "border-alert/40 text-alert",
  }[tone];
  return (
    <span className={`mono text-[10px] tracking-[0.14em] uppercase px-1.5 py-[1px] rounded-sm border ${styles}`}>
      {children}
    </span>
  );
}

export default function RulesPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-sm border border-bd bg-bg-panel">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]"
      >
        <span className="flex items-center gap-2 mono text-[11px] tracking-[0.22em] uppercase text-txt-primary">
          <BookOpen size={13} className="text-info" />
          Engine Rules &amp; Fill Logic
        </span>
        {open
          ? <ChevronDown size={14} className="text-txt-muted" />
          : <ChevronRight size={14} className="text-txt-muted" />}
      </button>

      {open && (
        <div className="border-t border-bd px-5 py-5 grid gap-5 md:grid-cols-2">
          <Section title="Tier Priority (Person-First)">
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="info">T1 · Unassigned</Pill>
              <Pill tone="info">T3 · Pre-1200 Callback</Pill>
              <Pill tone="info">T4 · After-1200 Callback</Pill>
              <Pill tone="warn">T5 · MHO Group</Pill>
              <Pill tone="neutral">UT-1 · Last</Pill>
            </div>
            <p className="text-txt-muted text-[12px]">
              Vacancies sorted longest-first, then earliest start. Callback &amp;
              MHO walked in CBMHO list order.
            </p>
          </Section>

          <Section title="Fire Captain Fill Rules">
            <ul className="space-y-1 list-disc list-inside marker:text-txt-muted">
              <li>
                <Pill tone="good">FCPT</Pill>
                <span className="ml-2">always first priority for any captain vacancy.</span>
              </li>
              <li>
                <Pill tone="warn">MFFII</Pill>{" "}
                <Pill tone="warn">FMFF</Pill>
                <span className="ml-2">
                  fill captain slots <em>only</em> when all FCPTs are exhausted —
                  evaluated <strong>per vacancy</strong>. Stamped{" "}
                  <Pill tone="bad">ACTING</Pill> and must be logged as ACTING in TeleStaff.
                </span>
              </li>
              <li>
                <Pill tone="bad">FFII</Pill>{" "}
                <Pill tone="bad">FFI</Pill>
                <span className="ml-2">never eligible for a captain slot.</span>
              </li>
              <li>
                Acting captains do <strong>not</strong> count toward a battalion's
                50% captain minimum (Bat 1-3 = 4 · Bat 4-5 = 3). Engine flags
                battalions that drop below minimum.
              </li>
            </ul>
          </Section>

          <Section title="Availability Gates">
            <ul className="space-y-1 list-disc list-inside marker:text-txt-muted">
              <li>
                <strong>Callback already deployed:</strong> if cells E
                (Assignment) <em>and</em> F (Times) are both populated on the
                CBMHO list, the member is excluded from the pool.
              </li>
              <li>
                <strong>MHO excused:</strong> Current Assignment of FLMA, ANNUAL,
                SICK, LIGHT DUTY, MILITARY → excluded.
              </li>
              <li>
                <strong>MHO already placed:</strong> if Assignment + Times
                already filled on the manual side → excluded.
              </li>
              <li>
                Columns J-M of CBMHO (Upstaffing / side tables) are{" "}
                <strong>completely ignored</strong>.
              </li>
            </ul>
          </Section>

          <Section title="Coverage Rules">
            <ul className="space-y-1 list-disc list-inside marker:text-txt-muted">
              <li>
                <strong>Full coverage required</strong> for auto-assign. Partial
                windows surface as advisory flags only — never auto-filled.
              </li>
              <li>
                <strong>12-hr MHO split:</strong> any unfilled ≥24h non-utility
                vacancy after callback passes is split into Day (08-20) /
                Night (20-08) halves before MHO runs.
              </li>
              <li>
                <strong>Utility 1:</strong> filled last, callback only.
                MHO is prohibited on UT-1.
              </li>
            </ul>
          </Section>

          <Section title="Flags Surfaced">
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="bad">Acting Captain</Pill>
              <Pill tone="bad">Unstaffed UT-1</Pill>
              <Pill tone="bad">Battalion Below Min</Pill>
              <Pill tone="warn">12-hr Split</Pill>
              <Pill tone="warn">MU·P Alert</Pill>
              <Pill tone="warn">Unconfirmed Status</Pill>
              <Pill tone="info">Specialty Min</Pill>
              <Pill tone="info">Fatigue Review</Pill>
            </div>
          </Section>

          <Section title="Confirm / Override">
            <p>
              Each assignment card requires explicit Confirm. Override lets the
              staffing officer substitute a different member with a typed
              reason, which is captured in the CSV and printable session export.
            </p>
          </Section>
        </div>
      )}
    </section>
  );
}
