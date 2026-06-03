import { useMemo, useState } from "react";

import TopNav      from "./components/TopNav.jsx";
import Banners     from "./components/Banners.jsx";
import StatsBar    from "./components/StatsBar.jsx";
import TabBar      from "./components/TabBar.jsx";
import Footer      from "./components/Footer.jsx";

import UploadGate     from "./tabs/UploadGate.jsx";
import AssignmentsTab from "./tabs/AssignmentsTab.jsx";
import MHOTab         from "./tabs/MHOTab.jsx";
import FlagsTab       from "./tabs/FlagsTab.jsx";
import MUPTab         from "./tabs/MUPTab.jsx";

import { parseUploads }        from "./parsers/index.js";
import { runEngine, getStats } from "./engine/engine.js";
import { buildFlags, highCount } from "./engine/flags.js";
import { downloadCSV, openPrintable, downloadPDF, downloadResultsHTML } from "./lib/exportSession.js";

function rescueSwimmerSeason(dateText) {
  const d = dateText ? new Date(dateText) : new Date();
  const month = Number.isNaN(d.getTime()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  return month >= 5 && month <= 10;
}

function askSpecialtyQuestions(input) {
  const stations = new Set((input?.vacancies || []).map((v) => v.station).filter(Boolean));
  const shortfalls = {};
  const ask = (key, message) => {
    if (!window.confirm(message)) shortfalls[key] = true;
  };

  for (const station of [1, 6, 12]) {
    if (stations.has(station)) {
      ask(
        `station-${station}-marine`,
        `Station ${station} specialty check:\n\nAre all marine qualifications met?\n\nOK = yes, use normal list order.\nCancel = no, prioritize marine-qualified members for this station.`
      );
    }
  }
  if (stations.has(3)) {
    ask(
      "station-3-hazmat",
      "Station 3 specialty check:\n\nAre all Hazmat requirements met?\n\nOK = yes, use normal list order.\nCancel = no, prioritize Hazmat-qualified members for Station 3."
    );
  }
  if (stations.has(7)) {
    ask(
      "station-7-tech",
      "Station 7 specialty check:\n\nAre all Tech Rescue requirements met?\n\nOK = yes, use normal list order.\nCancel = no, prioritize TECH-qualified members for Station 7."
    );
  }
  if (rescueSwimmerSeason(input?.shiftMeta?.shiftDate)) {
    for (const station of [1, 11, 15, 17]) {
      if (stations.has(station)) {
        ask(
          `station-${station}-frs`,
          `Station ${station} seasonal FRS check:\n\nAre 2 Fire Rescue Swimmers available for this station?\n\nOK = yes, use normal list order.\nCancel = no, prioritize FRS-qualified members for this station.`
        );
      }
    }
  }

  return shortfalls;
}

export default function App() {
  // ── File state ──
  const [rosterFile, setRosterFile] = useState(null);
  const [cbmhoFile,  setCbmhoFile]  = useState(null);
  const [rosterErr,  setRosterErr]  = useState(null);
  const [cbmhoErr,   setCbmhoErr]   = useState(null);

  // ── Engine state ──
  const [running, setRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [fatal, setFatal] = useState(null);
  const [parsedInput, setParsedInput] = useState(null);
  const [result, setResult] = useState(null);
  const [flags, setFlags] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [tab, setTab] = useState("assignments");

  function clearRun() {
    setResult(null); setFlags([]); setDiagnostics(null);
    setFatal(null); setParsedInput(null); setGeneratedAt(null);
  }
  function handleRoster(file, err) { setRosterFile(file); setRosterErr(err); clearRun(); }
  function handleCBMHO(file, err)  { setCbmhoFile(file);  setCbmhoErr(err);  clearRun(); }

  async function handleRun() {
    setRunning(true);
    setFatal(null);
    try {
      const { input, diagnostics: diag, fatal: f } = await parseUploads(rosterFile, cbmhoFile);
      setDiagnostics(diag);
      if (f) { setFatal(f); setRunning(false); return; }

      const specialtyShortfalls = askSpecialtyQuestions(input);
      const engineInput = { ...input, specialtyShortfalls };
      const r = runEngine(engineInput);
      const fl = buildFlags({ assignments: r.assignments, input: engineInput });
      const stamped = r.assignments.map((a) => ({
        ...a,
        confirmed: false,
        overrideName: null,
        overrideReason: null,
      }));
      setParsedInput(engineInput);
      setResult({ ...r, assignments: stamped });
      setFlags(fl);
      setGeneratedAt(new Date().toLocaleString());
      setTab("assignments");
    } catch (e) {
      setFatal(`Engine error: ${e.message || e}`);
    } finally {
      setRunning(false);
    }
  }

  function setAssignment(vacancyId, patch) {
    setResult((cur) => cur && ({
      ...cur,
      assignments: cur.assignments.map((a) =>
        a.vacancyId === vacancyId ? { ...a, ...patch } : a
      ),
    }));
  }
  const onConfirm  = (id) => setAssignment(id, { confirmed: true });
  const onOverride = (id, name, reason) =>
    setAssignment(id, { confirmed: true, overrideName: name, overrideReason: reason });

  const splitNotice = useMemo(() => {
    if (!result) return null;
    const splits = [...new Set(
      result.assignments.filter((a) => a.vacancy?.splitOf).map((a) => a.vacancy.splitOf)
    )];
    return splits.length ? `Split into Day/Night halves: ${splits.join(", ")}` : null;
  }, [result]);

  const callbackStatus = useMemo(() => {
    if (!parsedInput) return null;
    const pre  = parsedInput.callbackPre.length;
    const post = parsedInput.callbackPost.length;
    return { pre, post, empty: pre === 0 && post === 0 };
  }, [parsedInput]);

  const stats = useMemo(() => {
    if (!result) return null;
    const base = getStats(result.assignments);
    return { ...base, highFlags: highCount(flags) };
  }, [result, flags]);

  const shiftMeta = parsedInput?.shiftMeta || {};
  const tabCounts = result ? {
    assignments: result.assignments.length,
    mho:         parsedInput?.mho?.length || 0,
    flags:       flags.length,
    mup:         parsedInput?.muP?.length || 0,
  } : {};

  const exportPayload = result && {
    shiftDate:   shiftMeta.shiftDate,
    activeShift: shiftMeta.activeShift,
    mhoGroup:    shiftMeta.mhoGroup,
    generatedAt,
    assignments: result.assignments,
    flags,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav
        shiftDate={shiftMeta.shiftDate}
        activeShift={shiftMeta.activeShift}
        mhoGroup={shiftMeta.mhoGroup}
      />

      {result && <Banners splitNotice={splitNotice} callbackStatus={callbackStatus} />}
      {result && <StatsBar stats={stats} />}

      <UploadGate
        rosterFile={rosterFile}
        cbmhoFile={cbmhoFile}
        rosterError={rosterErr}
        cbmhoError={cbmhoErr}
        onRoster={handleRoster}
        onCBMHO={handleCBMHO}
        onRun={handleRun}
        running={running}
        hasRun={!!result}
        fatal={fatal}
        diagnostics={diagnostics}
        onExportCSV={() => exportPayload && downloadCSV(exportPayload)}
        onExportPDF={() => exportPayload && downloadPDF(exportPayload)}
        onExportResults={() => exportPayload && downloadResultsHTML(exportPayload)}
        onPrint={() => exportPayload && openPrintable(exportPayload)}
      />

      {result && (
        <>
          <TabBar active={tab} onChange={setTab} counts={tabCounts} />
          <main className="flex-1">
            {tab === "assignments" && (
              <AssignmentsTab
                assignments={result.assignments}
                onConfirm={onConfirm}
                onOverride={onOverride}
              />
            )}
            {tab === "mho"   && <MHOTab   mho={parsedInput?.mho || []} assignments={result.assignments} />}
            {tab === "flags" && <FlagsTab flags={flags} />}
            {tab === "mup"   && <MUPTab   muP={parsedInput?.muP || []} />}
          </main>
        </>
      )}

      {!result && <div className="flex-1" />}

      <Footer
        shiftDate={shiftMeta.shiftDate}
        activeShift={shiftMeta.activeShift}
        mhoGroup={shiftMeta.mhoGroup}
        generatedAt={generatedAt}
      />
    </div>
  );
}
