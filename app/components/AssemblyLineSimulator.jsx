"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const initialStations = [
  { name: "Stamping", seconds: 42 },
  { name: "Body welding", seconds: 55 },
  { name: "Surface preparation", seconds: 48 },
  { name: "Paint finishing", seconds: 62 },
  { name: "Powertrain preparation", seconds: 50 },
  { name: "Final assembly", seconds: 68 },
  { name: "Quality validation", seconds: 45 }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function isValidSavedScenario(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const inRange = (number, min, max) => Number.isFinite(number) && number >= min && number <= max;
  const supportedVersion = value.version === undefined || value.version === 1 || value.version === 2;
  const stationOrderMatches = value.stationNames === undefined ||
    (Array.isArray(value.stationNames) &&
      value.stationNames.length === initialStations.length &&
      value.stationNames.every((name, index) => name === initialStations[index].name));
  return supportedVersion &&
    stationOrderMatches &&
    Array.isArray(value.cycleTimes) &&
    value.cycleTimes.length === initialStations.length &&
    value.cycleTimes.every(seconds => inRange(seconds, 20, 180)) &&
    inRange(value.shiftHours, 4, 12) &&
    inRange(value.breakMinutes, 0, 120) &&
    inRange(value.availability, 50, 100) &&
    inRange(value.yieldRate, 70, 100) &&
    inRange(value.target, 50, 700) &&
    typeof value.savedAt === "string" &&
    Number.isFinite(Date.parse(value.savedAt));
}

function getScenarioProjection(snapshot) {
  const bottleneck = Math.max(...snapshot.cycleTimes);
  const netMinutes = Math.max(0, snapshot.shiftHours * 60 - snapshot.breakMinutes);
  const ideal = bottleneck > 0 ? Math.floor(netMinutes * 60 / bottleneck) : 0;
  const available = Math.floor(ideal * snapshot.availability / 100);
  const good = Math.floor(available * snapshot.yieldRate / 100);
  return {
    good,
    bottleneck,
    bottleneckName: initialStations[snapshot.cycleTimes.indexOf(bottleneck)]?.name || "—",
    gap: good - snapshot.target,
    attainmentPercent: snapshot.target > 0 ? good / snapshot.target * 100 : 0
  };
}

export default function AssemblyLineSimulator() {
  const [mount, setMount] = useState(null);
  useEffect(() => { setMount(document.getElementById("lineSimulatorMount")); }, []);
  const [stations, setStations] = useState(initialStations);
  const [shiftHours, setShiftHours] = useState(8);
  const [breakMinutes, setBreakMinutes] = useState(40);
  const [availability, setAvailability] = useState(90);
  const [yieldRate, setYieldRate] = useState(97);
  const [target, setTarget] = useState(350);
  const [chartEditMode, setChartEditMode] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showImprovementPlanner, setShowImprovementPlanner] = useState(false);
  const [proposedCycleTimes, setProposedCycleTimes] = useState(initialStations.map(station => station.seconds));
  const [savedScenario, setSavedScenario] = useState(null);
  const [scenarioLibrary, setScenarioLibrary] = useState([]);
  const [selectedScenarioNames, setSelectedScenarioNames] = useState([]);
  const [scenarioName, setScenarioName] = useState("Baseline improvement");
  const [scenarioSearch, setScenarioSearch] = useState("");
  const [scenarioSort, setScenarioSort] = useState("recent");
  const [renamingScenario, setRenamingScenario] = useState("");
  const [renameScenarioValue, setRenameScenarioValue] = useState("");
  const [pendingDeleteScenario, setPendingDeleteScenario] = useState("");
  const [scenarioStorageReady, setScenarioStorageReady] = useState(false);
  const [scenarioSaveMessage, setScenarioSaveMessage] = useState("");
  const scenarioFileInput = useRef(null);
  const scenarioLibraryFileInput = useRef(null);

  useEffect(() => {
    try {
      const rawLibrary = window.localStorage.getItem("factory-improvement-scenarios");
      if (rawLibrary) {
        const parsedLibrary = JSON.parse(rawLibrary);
        if (Array.isArray(parsedLibrary)) {
          setScenarioLibrary(parsedLibrary.filter(item =>
            item && typeof item.name === "string" && item.name.trim().length > 0 &&
            isValidSavedScenario(item.snapshot)
          ).slice(0, 10));
        }
      }
    } catch {
      // Named scenario library is optional when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("factory-improvement-scenario");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidSavedScenario(parsed)) {
          setSavedScenario(parsed);
        } else {
          setScenarioSaveMessage("A saved scenario was found but its data is incomplete or invalid. Save a new scenario to replace it.");
        }
      }
    } catch {
      // Keep scenario saving optional when browser storage is unavailable.
    }
    setScenarioStorageReady(true);
  }, []);

  function saveImprovementScenario() {
    const snapshot = {
      cycleTimes: proposedCycleTimes,
      target,
      shiftHours,
      breakMinutes,
      availability,
      yieldRate,
      savedAt: new Date().toISOString()
    };
    try {
      window.localStorage.setItem("factory-improvement-scenario", JSON.stringify(snapshot));
      setSavedScenario(snapshot);
      setScenarioSaveMessage("Scenario saved on this device. It will be available in this browser.");
    } catch {
      setScenarioSaveMessage("Could not save this scenario. Browser storage may be disabled or unavailable.");
    }
  }

  function saveNamedScenario() {
    const name = scenarioName.trim();
    if (!name) {
      setScenarioSaveMessage("Enter a name before saving this scenario.");
      return;
    }
    if (name.length > 48) {
      setScenarioSaveMessage("Scenario names must be 48 characters or fewer.");
      return;
    }
    const existing = scenarioLibrary.some(item => item.name.toLowerCase() === name.toLowerCase());
    if (!existing && scenarioLibrary.length >= 10) {
      setScenarioSaveMessage("The scenario library is full (10 of 10). Delete an existing scenario before saving a new one, or use the same name to update it.");
      return;
    }
    const snapshot = { version: 2, stationNames: initialStations.map(station => station.name), cycleTimes: [...proposedCycleTimes], target, shiftHours, breakMinutes, availability, yieldRate, savedAt: new Date().toISOString() };
    const next = [...scenarioLibrary.filter(item => item.name.toLowerCase() !== name.toLowerCase()), { name, snapshot }];
    try {
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setScenarioSaveMessage(existing ? `“${name}” updated in the named scenario library.` : `“${name}” saved to the named scenario library on this device.`);
    } catch {
      setScenarioSaveMessage("Could not save the named scenario. Browser storage may be unavailable.");
    }
  }

  function exportScenarioLibraryCsv() {
    if (scenarioLibrary.length === 0) {
      setScenarioSaveMessage("There are no named scenarios to export.");
      return;
    }
    const rows = [
      ["Factory scenario library comparison"],
      ["Scenario", "Saved at", "Good vehicles / shift", "Target", "Target attainment (%)", "Vehicles above / below target", "Target status", "Bottleneck station", "Bottleneck cycle (sec)", "Shift hours", "Break minutes", "Availability (%)", "Quality yield (%)", ...initialStations.map(station => station.name + " cycle (sec)")],
      ...scenarioLibrary.map(item => {
        const projection = getScenarioProjection(item.snapshot);
        return [
          item.name,
          item.snapshot.savedAt,
          projection.good,
          item.snapshot.target,
          Number(projection.attainmentPercent.toFixed(1)),
          projection.gap,
          projection.gap >= 0 ? "Target achieved" : "Below target",
          projection.bottleneckName,
          projection.bottleneck,
          item.snapshot.shiftHours,
          item.snapshot.breakMinutes,
          item.snapshot.availability,
          item.snapshot.yieldRate,
          ...item.snapshot.cycleTimes
        ];
      })
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-scenario-library.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage("Exported all named scenarios with shift assumptions and station cycle times to CSV.");
  }

  function exportScenarioLibraryJson() {
    const payload = { version: 1, type: "factory-scenario-library", exportedAt: new Date().toISOString(), scenarios: scenarioLibrary };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-scenario-library.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage("Named scenario library exported. Keep this JSON file as a backup or import it in another browser.");
  }

  async function importScenarioLibraryJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100 * 1024) throw new Error("Library file is too large");
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 || parsed?.type !== "factory-scenario-library" || !Array.isArray(parsed.scenarios)) throw new Error("Unsupported library format");
      const valid = parsed.scenarios.filter(item => item && typeof item.name === "string" && item.name.trim().length > 0 && item.name.trim().length <= 48 && isValidSavedScenario(item.snapshot) && item.snapshot.version === 2 && Array.isArray(item.snapshot.stationNames) && item.snapshot.stationNames.length === initialStations.length && item.snapshot.stationNames.every((name, index) => name === initialStations[index].name)).map(item => ({ name: item.name.trim(), snapshot: item.snapshot }));
      if (valid.length === 0) throw new Error("No valid scenarios found");
      const merged = [...scenarioLibrary];
      valid.forEach(item => { const index = merged.findIndex(entry => entry.name.toLowerCase() === item.name.toLowerCase()); if (index >= 0) merged[index] = item; else merged.push(item); });
      if (merged.length > 10) {
        setScenarioSaveMessage(`Import would create ${merged.length} named scenarios, but the library limit is 10. Delete ${merged.length - 10} existing scenario(s), then import again.`);
        return;
      }
      const next = merged;
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setSelectedScenarioNames(current => current.filter(name => next.some(item => item.name === name)));
      setScenarioSaveMessage("Imported " + valid.length + " valid named scenario(s). Matching names were updated; no existing scenarios were removed.");
    } catch {
      setScenarioSaveMessage("Library import failed. Choose a valid scenario-library JSON exported by this planner; files must match the current station layout.");
    } finally { event.target.value = ""; }
  }

  function toggleScenarioComparison(name, checked) {
    setSelectedScenarioNames(current => {
      if (!checked) return current.filter(item => item !== name);
      if (current.length >= 2) return [current[1], name];
      return [...current, name];
    });
  }

  async function copyNamedScenarioSummary(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be copied.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const lines = [
      "Factory improvement scenario",
      `Scenario: ${item.name}`,
      `Saved: ${new Date(snapshot.savedAt).toLocaleString()}`,
      `Projected good output: ${projection.good} vehicles / shift`,
      `Shift target: ${snapshot.target} vehicles / shift`,
      `Target status: ${projection.gap >= 0 ? "Achieved" : "Below target"}`,
      `Target gap: ${projection.gap > 0 ? "+" : ""}${projection.gap} vehicles`,
      `Bottleneck: ${projection.bottleneckName} (${projection.bottleneck}s)`,
      `Shift assumptions: ${snapshot.shiftHours}h; breaks ${snapshot.breakMinutes} min; availability ${snapshot.availability}%; quality yield ${snapshot.yieldRate}%`,
      "",
      "Station cycle times",
      ...initialStations.map((station, index) => `${station.name}: ${snapshot.cycleTimes[index]} seconds`),
      "",
      "Planning estimate only. Validate against actual factory production data."
    ].join("\\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines);
      setScenarioSaveMessage(`Copied “${item.name}” summary. You can paste it into a report or message.`);
    } catch {
      setScenarioSaveMessage("Could not copy automatically. Use Export Markdown, CSV or report instead.");
    }
  }

  function exportNamedScenarioJson(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const blob = new Blob([JSON.stringify(item.snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” as an individual scenario JSON. You can import it using Import JSON.`);
  }

  function exportNamedScenarioCsv(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const projection = getScenarioProjection(item.snapshot);
    const rows = [
      ["Factory improvement scenario", item.name],
      ["Saved at", item.snapshot.savedAt],
      ["Good vehicles / shift", projection.good],
      ["Target", item.snapshot.target],
      ["Vehicles above / below target", projection.gap],
      ["Target status", projection.gap >= 0 ? "Target achieved" : "Below target"],
      ["Bottleneck station", projection.bottleneckName],
      ["Bottleneck cycle (sec)", projection.bottleneck],
      ["Shift hours", item.snapshot.shiftHours],
      ["Break minutes", item.snapshot.breakMinutes],
      ["Availability (%)", item.snapshot.availability],
      ["Quality yield (%)", item.snapshot.yieldRate],
      [],
      ["Station", "Cycle time (seconds)"],
      ...initialStations.map((station, index) => [station.name, item.snapshot.cycleTimes[index]])
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” with production assumptions and all station cycle times as CSV.`);
  }



  function exportNamedScenarioMarkdown(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const safeCell = value => String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const rows = initialStations.map((station, index) =>
      `| ${safeCell(station.name)} | ${snapshot.cycleTimes[index]} s |`
    );
    const markdown = [
      `# ${safeCell(item.name)}`,
      "",
      `- Report type: Factory improvement scenario`,
      `- Saved: ${new Date(snapshot.savedAt).toLocaleString()}`,
      "",
      "## Production projection",
      "",
      `- Good vehicles per shift: **${projection.good.toLocaleString("en-IN")}**`,
      `- Shift target: **${snapshot.target.toLocaleString("en-IN")}**`,
      `- Target status: **${projection.gap >= 0 ? "Achieved" : "Below target"}**`,
      `- Target gap: **${projection.gap > 0 ? "+" : ""}${projection.gap} vehicles**`,
      `- Bottleneck station: **${safeCell(projection.bottleneckName)}**`,
      `- Bottleneck cycle time: **${projection.bottleneck} seconds**`,
      "",
      "## Operating assumptions",
      "",
      "| Setting | Value |",
      "|---|---:|",
      `| Shift hours | ${snapshot.shiftHours} |`,
      `| Break minutes | ${snapshot.breakMinutes} |`,
      `| Availability | ${snapshot.availability}% |`,
      `| Quality yield | ${snapshot.yieldRate}% |`,
      "",
      "## Station cycle times",
      "",
      "| Station | Cycle time |",
      "|---|---:|",
      ...rows,
      "",
      "> Educational planning estimate only. Validate projections against actual factory production data before making operational decisions."
    ].join("\n");
    const blob = new Blob(["\uFEFF", markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}-report.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” as a Markdown scenario report.`);
  }

  function exportNamedScenarioHtml(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) {
      setScenarioSaveMessage("This saved scenario is invalid and cannot be exported.");
      return;
    }
    const snapshot = item.snapshot;
    const projection = getScenarioProjection(snapshot);
    const escapeHtml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const stationRows = initialStations.map((station, index) => `<tr><th scope="row">${escapeHtml(station.name)}</th><td>${snapshot.cycleTimes[index]} s</td></tr>`).join("");
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(item.name)} · Factory scenario</title>
<style>
:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172b3a;background:#f4f7f8}
body{margin:0;padding:32px 16px}.report{max-width:820px;margin:auto;background:#fff;border:1px solid #dce5e8;border-radius:16px;padding:clamp(20px,4vw,40px);box-shadow:0 8px 28px #17334412}
h1{font-size:clamp(24px,4vw,34px);margin:0 0 8px;overflow-wrap:anywhere}h2{font-size:19px;margin:30px 0 12px;color:#245c62}
.meta,.notice{color:#526672;font-size:14px;line-height:1.6}.notice{padding:12px 14px;background:#f0f6f6;border-radius:9px;margin:18px 0}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.metric{border:1px solid #dce5e8;border-radius:12px;padding:16px}.metric span{display:block;color:#60727b;font-size:13px}.metric strong{display:block;font-size:25px;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #e5ecee}.print{border:0;background:#245c62;color:white;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer;margin:0 0 20px}
.table-wrap{overflow-x:auto}.foot{margin-top:28px;color:#667780;font-size:12px}
@media(max-width:600px){body{padding:12px 8px}.report{padding:18px 14px}.cards{grid-template-columns:1fr}}
@media print{body{padding:0;background:white}.report{border:0;box-shadow:none;max-width:none;padding:0}.print{display:none}h2{break-after:avoid}tr{break-inside:avoid}}
</style></head><body><main class="report">
<button class="print" type="button" onclick="window.print()">Print report</button>
<h1>${escapeHtml(item.name)}</h1>
<p class="meta">Factory improvement scenario · Saved ${escapeHtml(new Date(snapshot.savedAt).toLocaleString())}</p>
<div class="notice">${projection.gap >= 0 ? `Target achieved: ${projection.gap} good vehicles above the shift target.` : `Projected output is ${Math.abs(projection.gap)} good vehicles below the shift target.`}</div>
<div class="cards">
<div class="metric"><span>Projected good vehicles / shift</span><strong>${projection.good.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>Production target / shift</span><strong>${snapshot.target.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>Bottleneck station</span><strong style="font-size:19px">${escapeHtml(projection.bottleneckName)}</strong></div>
<div class="metric"><span>Bottleneck cycle time</span><strong>${projection.bottleneck} s</strong></div>
</div>
<h2>Operating assumptions</h2><div class="table-wrap"><table><tbody>
<tr><th>Shift hours</th><td>${snapshot.shiftHours}</td></tr><tr><th>Break minutes</th><td>${snapshot.breakMinutes}</td></tr>
<tr><th>Availability</th><td>${snapshot.availability}%</td></tr><tr><th>Quality yield</th><td>${snapshot.yieldRate}%</td></tr>
</tbody></table></div>
<h2>Station cycle times</h2><div class="table-wrap"><table><thead><tr><th>Station</th><th>Cycle time</th></tr></thead><tbody>${stationRows}</tbody></table></div>
<p class="foot">Educational planning estimate only. Validate projections against actual factory production data before making operational decisions.</p>
</main></body></html>`;
    const blob = new Blob(["\\uFEFF", html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "factory-scenario";
    link.href = url;
    link.download = `${safeName}-report.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported “${item.name}” as a standalone HTML scenario report.`);
  }

  function exportScenarioComparisonCsv(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, shiftHours: first.snapshot.shiftHours, breakMinutes: first.snapshot.breakMinutes, availability: first.snapshot.availability, yieldRate: first.snapshot.yieldRate, target: first.snapshot.target });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, shiftHours: first.snapshot.shiftHours, breakMinutes: first.snapshot.breakMinutes, availability: first.snapshot.availability, yieldRate: first.snapshot.yieldRate, target: first.snapshot.target });
    const rows = [
      ["Factory scenario comparison"],
      ["Metric", first.name, second.name, "Second minus first"],
      ["Good vehicles / shift", firstProjection.good, secondProjection.good, secondProjection.good - firstProjection.good],
      ["Target", first.snapshot.target, second.snapshot.target, second.snapshot.target - first.snapshot.target],
      ["Target gap", firstProjection.gap, secondProjection.gap, secondProjection.gap - firstProjection.gap],
      ["Bottleneck station", firstProjection.bottleneckName, secondProjection.bottleneckName, ""],
      ["Bottleneck cycle (sec)", firstProjection.bottleneck, secondProjection.bottleneck, secondProjection.bottleneck - firstProjection.bottleneck],
      ["Shift hours", first.snapshot.shiftHours, second.snapshot.shiftHours, second.snapshot.shiftHours - first.snapshot.shiftHours],
      ["Break minutes", first.snapshot.breakMinutes, second.snapshot.breakMinutes, second.snapshot.breakMinutes - first.snapshot.breakMinutes],
      ["Availability (%)", first.snapshot.availability, second.snapshot.availability, second.snapshot.availability - first.snapshot.availability],
      ["Quality yield (%)", first.snapshot.yieldRate, second.snapshot.yieldRate, second.snapshot.yieldRate - first.snapshot.yieldRate],
      ["Normalized good vehicles / shift (first scenario conditions)", normalizedFirst.good, normalizedSecond.good, normalizedSecond.good - normalizedFirst.good],
      [],
      ["Station cycle-time comparison (seconds)", first.name, second.name, "Second minus first"],
      ...initialStations.map((station, index) => [station.name, first.snapshot.cycleTimes[index], second.snapshot.cycleTimes[index], second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index]])
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    setScenarioSaveMessage(`Exported the comparison between “${first.name}” and “${second.name}” as CSV.`);
  }

  async function copyScenarioComparisonSummary(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before copying their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const commonConditions = {
      shiftHours: first.snapshot.shiftHours,
      breakMinutes: first.snapshot.breakMinutes,
      availability: first.snapshot.availability,
      yieldRate: first.snapshot.yieldRate,
      target: first.snapshot.target
    };
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...commonConditions });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...commonConditions });
    const difference = secondProjection.good - firstProjection.good;
    const normalizedDifference = normalizedSecond.good - normalizedFirst.good;
    const lines = [
      "FACTORY SCENARIO COMPARISON",
      `First scenario: ${first.name}`,
      `Second scenario: ${second.name}`,
      "",
      `Projected good vehicles/shift: ${firstProjection.good} vs ${secondProjection.good}`,
      `Overall difference (second minus first): ${difference > 0 ? "+" : ""}${difference}`,
      `Normalized output using first scenario conditions: ${normalizedFirst.good} vs ${normalizedSecond.good}`,
      `Cycle-time-only difference: ${normalizedDifference > 0 ? "+" : ""}${normalizedDifference}`,
      "",
      `First bottleneck: ${firstProjection.bottleneckName} (${firstProjection.bottleneck}s)`,
      `Second bottleneck: ${secondProjection.bottleneckName} (${secondProjection.bottleneck}s)`,
      `Same operating assumptions: ${["shiftHours", "breakMinutes", "availability", "yieldRate", "target"].every(key => first.snapshot[key] === second.snapshot[key]) ? "Yes" : "No"}`,
      `Shared conditions for normalized comparison: ${commonConditions.shiftHours}h shift, ${commonConditions.breakMinutes} min breaks, ${commonConditions.availability}% availability, ${commonConditions.yieldRate}% quality yield, target ${commonConditions.target}`,
      "",
      "STATION CYCLE TIMES (SECONDS)",
      ...initialStations.map((station, index) => `${station.name}: ${first.snapshot.cycleTimes[index]}s -> ${second.snapshot.cycleTimes[index]}s (${second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index] > 0 ? "+" : ""}${second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index]}s)`)
    ];
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines.join("\\n"));
      setScenarioSaveMessage("Scenario comparison summary copied. You can paste it into a report or message.");
    } catch {
      setScenarioSaveMessage("Could not copy the comparison summary. Use Export comparison CSV or JSON instead.");
    }
  }

  function exportScenarioComparisonJson(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const sharedConditions = {
      shiftHours: first.snapshot.shiftHours,
      breakMinutes: first.snapshot.breakMinutes,
      availability: first.snapshot.availability,
      yieldRate: first.snapshot.yieldRate,
      target: first.snapshot.target
    };
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...sharedConditions });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...sharedConditions });
    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate", "target"].every(key => first.snapshot[key] === second.snapshot[key]);
    const payload = {
      version: 1,
      type: "factory-scenario-comparison",
      exportedAt: new Date().toISOString(),
      comparisonOrder: "second-minus-first",
      sameOperatingAssumptions: sameAssumptions,
      scenarios: [
        { name: first.name, snapshot: first.snapshot, projection: firstProjection },
        { name: second.name, snapshot: second.snapshot, projection: secondProjection }
      ],
      normalizedComparison: {
        conditionsFromScenario: first.name,
        conditions: sharedConditions,
        firstGoodVehiclesPerShift: normalizedFirst.good,
        secondGoodVehiclesPerShift: normalizedSecond.good,
        differenceGoodVehiclesPerShift: normalizedSecond.good - normalizedFirst.good
      },
      stationCycleDifferences: initialStations.map((station, index) => ({
        station: station.name,
        firstCycleSeconds: first.snapshot.cycleTimes[index],
        secondCycleSeconds: second.snapshot.cycleTimes[index],
        differenceSeconds: second.snapshot.cycleTimes[index] - first.snapshot.cycleTimes[index]
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported the structured comparison between “${first.name}” and “${second.name}” as JSON.`);
  }


  function exportScenarioComparisonMarkdown(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const firstProjection = getScenarioProjection(first.snapshot);
    const secondProjection = getScenarioProjection(second.snapshot);
    const conditions = {
      shiftHours: first.snapshot.shiftHours,
      breakMinutes: first.snapshot.breakMinutes,
      availability: first.snapshot.availability,
      yieldRate: first.snapshot.yieldRate,
      target: first.snapshot.target
    };
    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...conditions });
    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...conditions });
    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate", "target"].every(key => first.snapshot[key] === second.snapshot[key]);
    const safeCell = value => String(value).replace(/\\|/g, "\\\\|").replace(/\\r?\\n/g, " ");
    const rows = initialStations.map((station, index) => {
      const a = first.snapshot.cycleTimes[index];
      const b = second.snapshot.cycleTimes[index];
      const delta = b - a;
      return `| ${safeCell(station.name)} | ${a} s | ${b} s | ${delta > 0 ? "+" : ""}${delta} s |`;
    });
    const markdown = [
      "# Factory Scenario Comparison",
      "",
      `- Exported: ${new Date().toLocaleString()}`,
      `- Scenario A: **${safeCell(first.name)}**`,
      `- Scenario B: **${safeCell(second.name)}**`,
      `- Assumptions: ${sameAssumptions ? "Like-for-like" : "Different operating assumptions"}`,
      "",
      "## Production summary",
      "",
      "| Metric | Scenario A | Scenario B | B − A |",
      "|---|---:|---:|---:|",
      `| Good vehicles / shift | ${firstProjection.good} | ${secondProjection.good} | ${secondProjection.good - firstProjection.good > 0 ? "+" : ""}${secondProjection.good - firstProjection.good} |`,
      `| Target | ${first.snapshot.target} | ${second.snapshot.target} | ${second.snapshot.target - first.snapshot.target} |`,
      `| Target gap | ${firstProjection.good - first.snapshot.target} | ${secondProjection.good - second.snapshot.target} | ${(secondProjection.good - second.snapshot.target) - (firstProjection.good - first.snapshot.target)} |`,
      `| Bottleneck cycle | ${firstProjection.bottleneck} s | ${secondProjection.bottleneck} s | ${secondProjection.bottleneck - firstProjection.bottleneck} s |`,
      "",
      "## Operating assumptions",
      "",
      "| Setting | Scenario A | Scenario B |",
      "|---|---:|---:|",
      `| Shift hours | ${first.snapshot.shiftHours} | ${second.snapshot.shiftHours} |`,
      `| Break minutes | ${first.snapshot.breakMinutes} | ${second.snapshot.breakMinutes} |`,
      `| Availability | ${first.snapshot.availability}% | ${second.snapshot.availability}% |`,
      `| Quality yield | ${first.snapshot.yieldRate}% | ${second.snapshot.yieldRate}% |`,
      "",
      "## Cycle-time-only comparison",
      "",
      `Both scenarios recalculated using Scenario A conditions (${conditions.shiftHours} h shift, ${conditions.breakMinutes} min breaks, ${conditions.availability}% availability, ${conditions.yieldRate}% quality yield).`,
      "",
      `- Scenario A normalized output: **${normalizedFirst.good} good vehicles/shift**`,
      `- Scenario B normalized output: **${normalizedSecond.good} good vehicles/shift**`,
      `- Normalized difference (B − A): **${normalizedSecond.good - normalizedFirst.good > 0 ? "+" : ""}${normalizedSecond.good - normalizedFirst.good} vehicles/shift**`,
      "",
      "## Station cycle-time details",
      "",
      "| Station | Scenario A | Scenario B | B − A |",
      "|---|---:|---:|---:|",
      ...rows,
      "",
      "> Educational planning estimate. Validate projections against actual factory production data."
    ].join("\\n");
    const blob = new Blob(["\\uFEFF", markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported the comparison between “${first.name}” and “${second.name}” as a Markdown report.`);
  }


  function exportScenarioComparisonHtml(first, second) {
    if (!first || !second || !isValidSavedScenario(first.snapshot) || !isValidSavedScenario(second.snapshot)) {
      setScenarioSaveMessage("Select two valid saved scenarios before exporting their comparison.");
      return;
    }
    const a = first.snapshot;
    const b = second.snapshot;
    const projectionA = getScenarioProjection(a);
    const projectionB = getScenarioProjection(b);
    const conditions = { shiftHours: a.shiftHours, breakMinutes: a.breakMinutes, availability: a.availability, yieldRate: a.yieldRate, target: a.target };
    const normalizedA = getScenarioProjection({ ...a, ...conditions });
    const normalizedB = getScenarioProjection({ ...b, ...conditions });
    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate", "target"].every(key => a[key] === b[key]);
    const escapeHtml = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const signed = value => `${value > 0 ? "+" : ""}${value}`;
    const stationRows = initialStations.map((station, index) => {
      const delta = b.cycleTimes[index] - a.cycleTimes[index];
      return `<tr><th scope="row">${escapeHtml(station.name)}</th><td>${a.cycleTimes[index]} s</td><td>${b.cycleTimes[index]} s</td><td class="${delta < 0 ? "better" : delta > 0 ? "worse" : ""}">${signed(delta)} s</td></tr>`;
    }).join("");
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factory scenario comparison</title>
<style>
:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#172b3a;background:#f4f7f8}
body{margin:0;padding:32px 16px}.report{max-width:960px;margin:auto;background:#fff;border:1px solid #dce5e8;border-radius:16px;padding:clamp(20px,4vw,40px);box-shadow:0 8px 28px #17334412}
h1{font-size:clamp(24px,4vw,34px);margin:0 0 8px}h2{font-size:19px;margin:30px 0 12px;color:#245c62}
.meta,.notice{color:#526672;font-size:14px;line-height:1.6}.notice{padding:12px 14px;background:#f0f6f6;border-radius:9px;margin:18px 0}
.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.metric{border:1px solid #dce5e8;border-radius:12px;padding:16px}.metric span{display:block;color:#60727b;font-size:13px}.metric strong{display:block;font-size:25px;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #e5ecee}thead th{background:#f2f6f7;color:#405661}.better{color:#087b62;font-weight:700}.worse{color:#b4533c;font-weight:700}
.table-wrap{overflow-x:auto}.foot{margin-top:28px;color:#667780;font-size:12px}.print{border:0;background:#245c62;color:white;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer;margin:0 0 20px}
@media(max-width:600px){body{padding:12px 8px}.report{padding:18px 14px}.cards{grid-template-columns:1fr}table{min-width:520px}}
@media print{body{padding:0;background:white}.report{border:0;box-shadow:none;max-width:none;padding:0}.print{display:none}h2{break-after:avoid}tr{break-inside:avoid}}
</style>
</head>
<body><main class="report">
<button class="print" type="button" onclick="window.print()">Print report</button>
<h1>Factory Scenario Comparison</h1>
<p class="meta">Exported ${escapeHtml(new Date().toLocaleString())}<br>Scenario A: <strong>${escapeHtml(first.name)}</strong> · Scenario B: <strong>${escapeHtml(second.name)}</strong></p>
<div class="notice">${sameAssumptions ? "Like-for-like comparison: both scenarios use the same operating assumptions." : "Different operating assumptions detected. The overall output difference includes changes to shift time, breaks, availability, quality yield or target."}</div>
<h2>Production summary</h2>
<div class="cards">
<div class="metric"><span>${escapeHtml(first.name)} · Good vehicles / shift</span><strong>${projectionA.good.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>${escapeHtml(second.name)} · Good vehicles / shift</span><strong>${projectionB.good.toLocaleString("en-IN")}</strong></div>
</div>
<div class="table-wrap"><table><thead><tr><th>Metric</th><th>Scenario A</th><th>Scenario B</th><th>B − A</th></tr></thead><tbody>
<tr><th>Good vehicles / shift</th><td>${projectionA.good}</td><td>${projectionB.good}</td><td>${signed(projectionB.good-projectionA.good)}</td></tr>
<tr><th>Target</th><td>${a.target}</td><td>${b.target}</td><td>${signed(b.target-a.target)}</td></tr>
<tr><th>Target gap</th><td>${projectionA.good-a.target}</td><td>${projectionB.good-b.target}</td><td>${signed((projectionB.good-b.target)-(projectionA.good-a.target))}</td></tr>
<tr><th>Bottleneck cycle</th><td>${projectionA.bottleneck} s</td><td>${projectionB.bottleneck} s</td><td>${signed(projectionB.bottleneck-projectionA.bottleneck)} s</td></tr>
</tbody></table></div>
<h2>Operating assumptions</h2>
<div class="table-wrap"><table><thead><tr><th>Setting</th><th>Scenario A</th><th>Scenario B</th></tr></thead><tbody>
<tr><th>Shift hours</th><td>${a.shiftHours}</td><td>${b.shiftHours}</td></tr>
<tr><th>Break minutes</th><td>${a.breakMinutes}</td><td>${b.breakMinutes}</td></tr>
<tr><th>Availability</th><td>${a.availability}%</td><td>${b.availability}%</td></tr>
<tr><th>Quality yield</th><td>${a.yieldRate}%</td><td>${b.yieldRate}%</td></tr>
</tbody></table></div>
<h2>Cycle-time-only comparison</h2>
<p class="meta">Both scenarios recalculated using Scenario A conditions: ${conditions.shiftHours} h shift, ${conditions.breakMinutes} min breaks, ${conditions.availability}% availability and ${conditions.yieldRate}% quality yield.</p>
<div class="cards">
<div class="metric"><span>Scenario A normalized output</span><strong>${normalizedA.good.toLocaleString("en-IN")}</strong></div>
<div class="metric"><span>Scenario B normalized output</span><strong>${normalizedB.good.toLocaleString("en-IN")}</strong></div>
</div>
<p><strong>Normalized difference (B − A): ${signed(normalizedB.good-normalizedA.good)} good vehicles / shift</strong></p>
<h2>Station cycle-time details</h2>
<div class="table-wrap"><table><thead><tr><th>Station</th><th>Scenario A</th><th>Scenario B</th><th>B − A</th></tr></thead><tbody>${stationRows}</tbody></table></div>
<p class="foot">Educational planning estimate only. Validate projections against actual factory production data before making operational decisions.</p>
</main></body></html>`;
    const blob = new Blob(["\\uFEFF", html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFirst = first.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-a";
    const safeSecond = second.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scenario-b";
    link.href = url;
    link.download = `factory-comparison-${safeFirst}-vs-${safeSecond}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage(`Exported the comparison between “${first.name}” and “${second.name}” as a standalone HTML report.`);
  }

  function loadNamedScenario(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) return;
    const snapshot = item.snapshot;
    setProposedCycleTimes([...snapshot.cycleTimes]);
    setShiftHours(snapshot.shiftHours);
    setBreakMinutes(snapshot.breakMinutes);
    setAvailability(snapshot.availability);
    setYieldRate(snapshot.yieldRate);
    setTarget(snapshot.target);
    setScenarioSaveMessage(`Loaded “${item.name}”. Review the projection before saving changes.`);
  }

  function renameNamedScenario(oldName) {
    const nextName = renameScenarioValue.trim();
    if (!nextName) {
      setScenarioSaveMessage("Enter a name before renaming this scenario.");
      return;
    }
    if (nextName.length > 48) {
      setScenarioSaveMessage("Scenario names must be 48 characters or fewer.");
      return;
    }
    if (scenarioLibrary.some(item => item.name.toLowerCase() === nextName.toLowerCase() && item.name !== oldName)) {
      setScenarioSaveMessage("A scenario with that name already exists. Choose a different name.");
      return;
    }
    const next = scenarioLibrary.map(item => item.name === oldName ? { ...item, name: nextName } : item);
    try {
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setSelectedScenarioNames(current => current.map(name => name === oldName ? nextName : name));
      setScenarioName(current => current === oldName ? nextName : current);
      setRenamingScenario("");
      setRenameScenarioValue("");
      setScenarioSaveMessage(`Renamed “${oldName}” to “${nextName}”.`);
    } catch {
      setScenarioSaveMessage("Could not rename this scenario. Browser storage may be unavailable.");
    }
  }

  function duplicateNamedScenario(item) {
    if (!item || !isValidSavedScenario(item.snapshot)) return;
    if (scenarioLibrary.length >= 10) {
      setScenarioSaveMessage("The scenario library is full. Delete a scenario before creating a duplicate.");
      return;
    }
    const baseName = `Copy of ${item.name}`.slice(0, 48);
    let duplicateName = baseName;
    let suffix = 2;
    while (scenarioLibrary.some(entry => entry.name.toLowerCase() === duplicateName.toLowerCase())) {
      const ending = ` (${suffix})`;
      duplicateName = `${baseName.slice(0, 48 - ending.length)}${ending}`;
      suffix += 1;
    }
    const duplicate = {
      name: duplicateName,
      snapshot: { ...item.snapshot, cycleTimes: [...item.snapshot.cycleTimes], savedAt: new Date().toISOString() }
    };
    const next = [...scenarioLibrary, duplicate];
    try {
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setScenarioName(duplicateName);
      setScenarioSaveMessage(`Created “${duplicateName}”. You can load it and adjust its settings independently.`);
    } catch {
      setScenarioSaveMessage("Could not duplicate this scenario. Browser storage may be unavailable.");
    }
  }

  function deleteNamedScenario(name) {
    const next = scenarioLibrary.filter(item => item.name !== name);
    try {
      window.localStorage.setItem("factory-improvement-scenarios", JSON.stringify(next));
      setScenarioLibrary(next);
      setSelectedScenarioNames(current => current.filter(item => item !== name));
      setPendingDeleteScenario("");
      setScenarioSaveMessage(`“${name}” removed from the named scenario library.`);
    } catch {
      setScenarioSaveMessage("Could not update the named scenario library.");
    }
  }

  async function copyScenarioSummary() {
    const lines = [
      "Factory line improvement scenario",
      `Projected good output: ${improvement.good} vehicles / shift`,
      `Current output: ${result.goodUnits} vehicles / shift`,
      `Change vs current: ${improvement.gain > 0 ? "+" : ""}${improvement.gain} vehicles / shift`,
      `Target: ${target} vehicles / shift — ${improvement.meetsTarget ? "Achieved" : `Short by ${Math.abs(improvement.targetGap)}`}`,
      `Projected bottleneck: ${improvement.bottleneckName} (${improvement.bottleneck}s)`,
      `Shift: ${shiftHours}h; break: ${breakMinutes} min; availability: ${availability}%; quality yield: ${yieldRate}%`,
      "",
      "Station cycle times (current → proposed)",
      ...stations.map((station, index) => `${station.name}: ${station.seconds}s → ${proposedCycleTimes[index] ?? station.seconds}s`)
    ].join("\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(lines);
      setScenarioSaveMessage("Scenario summary copied. You can paste it into a report or message.");
    } catch {
      setScenarioSaveMessage("Could not copy automatically. Use Export scenario CSV or Export JSON instead.");
    }
  }

  function exportScenarioJson() {
    const snapshot = { version: 2, stationNames: initialStations.map(station => station.name), cycleTimes: proposedCycleTimes, target, shiftHours, breakMinutes, availability, yieldRate, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-improvement-scenario.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScenarioSaveMessage("Scenario JSON exported. You can import this file on another device.");
  }

  async function importScenarioJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100 * 1024) throw new Error("Scenario file is too large");
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 && parsed?.version !== 2) throw new Error("Unsupported scenario version");
      if (parsed.version === 2 && (!Array.isArray(parsed.stationNames) ||
        parsed.stationNames.length !== initialStations.length ||
        !parsed.stationNames.every((name, index) => name === initialStations[index].name))) {
        throw new Error("Station layout does not match");
      }
      if (!isValidSavedScenario(parsed)) throw new Error("Invalid scenario format");
      setProposedCycleTimes([...parsed.cycleTimes]);
      setShiftHours(parsed.shiftHours);
      setBreakMinutes(parsed.breakMinutes);
      setAvailability(parsed.availability);
      setYieldRate(parsed.yieldRate);
      setTarget(parsed.target);
      setScenarioSaveMessage("Scenario imported. Review the projection, then choose Save scenario to keep it in this browser.");
    } catch {
      setScenarioSaveMessage("Import failed. Use a version 1 or 2 scenario JSON exported from this planner, with matching station names and valid settings.");
    } finally {
      event.target.value = "";
    }
  }

  function loadImprovementScenario() {
    if (!savedScenario) return;
    setProposedCycleTimes([...savedScenario.cycleTimes]);
    // Restore the assumptions saved with the scenario so its projection is reproducible.
    setShiftHours(clamp(Number(savedScenario.shiftHours) || 8, 4, 12));
    setBreakMinutes(clamp(Number(savedScenario.breakMinutes) || 0, 0, 120));
    setAvailability(clamp(Number(savedScenario.availability) || 90, 50, 100));
    setYieldRate(clamp(Number(savedScenario.yieldRate) || 97, 70, 100));
    setTarget(clamp(Number(savedScenario.target) || 350, 50, 700));
  }

  function clearImprovementScenario() {
    try { window.localStorage.removeItem("factory-improvement-scenario"); } catch {}
    setSavedScenario(null);
    setScenarioSaveMessage("Saved scenario cleared from this device.");
  }
  const [chartVisibility, setChartVisibility] = useState({ radar: true, capacity: true, ratios: true, losses: true });
  const [chartTitles, setChartTitles] = useState({
    radar: "Station cycle times",
    capacity: "Capacity indicators",
    ratios: "Availability & quality yield",
    losses: "Where does capacity go?"
  });
  const defaultChartTitles = {
    radar: "Station cycle times",
    capacity: "Capacity indicators",
    ratios: "Availability & quality yield",
    losses: "Where does capacity go?"
  };
  const [chartSettingsLoaded, setChartSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("factory-chart-preferences");
      if (saved) {
        const preferences = JSON.parse(saved);
        if (preferences.visibility && typeof preferences.visibility === "object") {
          setChartVisibility(current => ({ ...current, ...preferences.visibility }));
        }
        if (preferences.titles && typeof preferences.titles === "object") {
          setChartTitles(current => ({ ...current, ...preferences.titles }));
        }
      }
    } catch {
      // Keep the default chart preferences if saved browser data is unavailable.
    }
    setChartSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!chartSettingsLoaded) return;
    try {
      window.localStorage.setItem("factory-chart-preferences", JSON.stringify({
        visibility: chartVisibility,
        titles: chartTitles
      }));
    } catch {
      // Chart editing remains available for this visit if storage is blocked.
    }
  }, [chartSettingsLoaded, chartVisibility, chartTitles]);

  const result = useMemo(() => {
    const bottleneck = Math.max(...stations.map(station => station.seconds));
    const netMinutes = Math.max(0, shiftHours * 60 - breakMinutes);
    const ideal = bottleneck > 0 ? Math.floor(netMinutes * 60 / bottleneck) : 0;
    const available = Math.floor(ideal * availability / 100);
    const goodUnits = Math.floor(available * yieldRate / 100);
    return {
      bottleneck,
      bottleneckName: stations.find(station => station.seconds === bottleneck)?.name || "—",
      netMinutes,
      ideal,
      available,
      goodUnits,
      gap: goodUnits - target,
      hourly: netMinutes > 0 ? goodUnits / (netMinutes / 60) : 0,
      taktSeconds: target > 0 ? netMinutes * 60 / target : 0
    };
  }, [stations, shiftHours, breakMinutes, availability, yieldRate, target]);

  const improvement = useMemo(() => {
    const proposedBottleneck = Math.max(...proposedCycleTimes);
    const proposedIdeal = proposedBottleneck > 0 ? Math.floor(result.netMinutes * 60 / proposedBottleneck) : 0;
    const proposedAvailable = Math.floor(proposedIdeal * availability / 100);
    const proposedGood = Math.floor(proposedAvailable * yieldRate / 100);
    const requiredAvailable = target > 0 ? Math.ceil(target / (yieldRate / 100)) : 0;
    const requiredIdeal = target > 0 ? Math.ceil(requiredAvailable / (availability / 100)) : 0;
    const requiredCycle = requiredIdeal > 0 ? Math.floor(result.netMinutes * 60 / requiredIdeal) : 180;
    return {
      bottleneck: proposedBottleneck,
      bottleneckName: stations[proposedCycleTimes.indexOf(proposedBottleneck)]?.name || "—",
      ideal: proposedIdeal,
      good: proposedGood,
      gain: proposedGood - result.goodUnits,
      targetGap: proposedGood - target,
      meetsTarget: proposedGood >= target,
      requiredCycle,
      feasible: target === 0 || requiredCycle >= 20
    };
  }, [proposedCycleTimes, result.netMinutes, result.goodUnits, availability, yieldRate, stations, target]);

  const savedScenarioChanged = useMemo(() => {
    if (!savedScenario) return false;
    return savedScenario.cycleTimes.some((value, index) => value !== proposedCycleTimes[index]) ||
      savedScenario.target !== target ||
      savedScenario.shiftHours !== shiftHours ||
      savedScenario.breakMinutes !== breakMinutes ||
      savedScenario.availability !== availability ||
      savedScenario.yieldRate !== yieldRate;
  }, [savedScenario, proposedCycleTimes, target, shiftHours, breakMinutes, availability, yieldRate]);

  const savedScenarioSummary = useMemo(() => {
    if (!savedScenario) return null;
    const savedBottleneck = Math.max(...savedScenario.cycleTimes);
    const savedNetMinutes = Math.max(0, savedScenario.shiftHours * 60 - savedScenario.breakMinutes);
    const savedIdeal = savedBottleneck > 0 ? Math.floor(savedNetMinutes * 60 / savedBottleneck) : 0;
    const savedAvailable = Math.floor(savedIdeal * savedScenario.availability / 100);
    const savedGood = Math.floor(savedAvailable * savedScenario.yieldRate / 100);
    return {
      bottleneck: savedBottleneck,
      good: savedGood,
      gap: savedGood - savedScenario.target,
      meetsTarget: savedGood >= savedScenario.target
    };
  }, [savedScenario]);

  const improvementPriorities = useMemo(() => stations
    .map((station, index) => ({
      ...station,
      index,
      reductionNeeded: Math.max(0, station.seconds - improvement.requiredCycle),
      proposedReduction: Math.max(0, station.seconds - (proposedCycleTimes[index] ?? station.seconds))
    }))
    .sort((a, b) => b.reductionNeeded - a.reductionNeeded || b.seconds - a.seconds), 
  [stations, improvement.requiredCycle, proposedCycleTimes]);

  function updateStation(index, seconds) {
    setStations(current => current.map((station, i) =>
      i === index ? { ...station, seconds: clamp(Number(seconds) || 1, 20, 180) } : station
    ));
  }

  function exportSimulation() {
    const rows = [
      ["Factory process simulation report"],
      ["Metric", "Value"],
      ["Estimated good vehicles per shift", result.goodUnits],
      ["Production target", target],
      ["Output vs target", result.gap],
      ["Slowest station", result.bottleneckName],
      ["Bottleneck cycle time (seconds)", result.bottleneck],
      ["Net production time (minutes)", result.netMinutes],
      ["Ideal line capacity", result.ideal],
      ["Available capacity", result.available],
      ["Line availability (%)", availability],
      ["Quality yield (%)", yieldRate],
      ["Target takt time before losses (seconds per vehicle)", result.taktSeconds.toFixed(1)],
      [],
      ["Station", "Cycle time (seconds)", "Bottleneck", "Target takt status"],
      ...stations.map(station => [station.name, station.seconds, station.seconds === result.bottleneck ? "Yes" : "No", station.seconds <= result.taktSeconds ? "Within takt" : "Exceeds takt"])
    ];
    const csv = rows.map(row => row.map(value => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-process-simulation.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportImprovementScenario() {
    const rows = [
      ["Factory line improvement scenario"],
      ["Metric", "Current", "Proposed"],
      ["Good vehicles per shift", result.goodUnits, improvement.good],
      ["Bottleneck station", result.bottleneckName, improvement.bottleneckName],
      ["Bottleneck cycle time (seconds)", result.bottleneck, improvement.bottleneck],
      ["Production change (good vehicles)", 0, improvement.gain],
      ["Target status", "Current simulation", improvement.meetsTarget ? "Target achieved" : "Target not yet achieved"],
      ["Good vehicles above / below target", result.gap, improvement.targetGap],
      ["Shift target", target, target],
      ["Availability (%)", availability, availability],
      ["Quality yield (%)", yieldRate, yieldRate],
      [],
      ["Station", "Current cycle (seconds)", "Proposed cycle (seconds)", "Reduction (seconds)"],
      ...stations.map((station, index) => {
        const proposed = proposedCycleTimes[index] ?? station.seconds;
        return [station.name, station.seconds, proposed, station.seconds - proposed];
      })
    ];
    const csv = rows.map(row => row.map(value => {
      const cell = String(value ?? "");
      return /[",\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "factory-line-improvement-scenario.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStations(initialStations);
    setProposedCycleTimes(initialStations.map(station => station.seconds));
    setShiftHours(8);
    setBreakMinutes(40);
    setAvailability(90);
    setYieldRate(97);
    setTarget(350);
    setChartVisibility({ radar: true, capacity: true, ratios: true, losses: true });
    setChartTitles(defaultChartTitles);
    setChartEditMode(false);
  }

  const visibleScenarioLibrary = scenarioLibrary
    .filter(item => item.name.toLowerCase().includes(scenarioSearch.trim().toLowerCase()))
    .sort((a, b) => {
      if (scenarioSort === "name") return a.name.localeCompare(b.name);
      if (scenarioSort === "output") return getScenarioProjection(b.snapshot).good - getScenarioProjection(a.snapshot).good;
      if (scenarioSort === "target") return getScenarioProjection(b.snapshot).gap - getScenarioProjection(a.snapshot).gap;
      return Date.parse(b.snapshot.savedAt) - Date.parse(a.snapshot.savedAt);
    });

  if (!mount) return null;
  return createPortal(
    <section className="line-simulator w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8" aria-labelledby="lineSimulatorTitle">
      <div className="line-simulator-heading">
        <div>
          <span className="eyebrow">JAVASCRIPT PROJECT / 09</span>
          <h2 id="lineSimulatorTitle">Test the <em>production line.</em></h2>
          <p>Change station cycle times and shift conditions to understand how a bottleneck affects the output of a balanced production line.</p>
        </div>
        <button className="line-reset" type="button" onClick={reset}>Reset example ↺</button>
      </div>

      <div className="line-sim-layout">
        <div className="line-sim-controls">
          <div className="line-sim-section-title"><span>01 / STATION CYCLE TIMES</span><small>SECONDS PER VEHICLE</small></div>
          {stations.map((station, index) => {
            const isBottleneck = station.seconds === result.bottleneck;
  return (
              <div className={`line-station-row${isBottleneck ? " is-bottleneck" : ""}`} key={station.name}>
                <div className="line-station-top">
                  <label htmlFor={`station-${index}`}>{station.name}</label>
                  <div className="line-station-value">
                    <input
                      aria-label={`${station.name} cycle time in seconds`}
                      type="number"
                      min="20"
                      max="180"
                      step="1"
                      value={station.seconds}
                      onChange={event => {
                        const value = event.target.value;
                        if (value !== "" && Number(value) >= 20 && Number(value) <= 180) updateStation(index, value);
                      }}
                    />
                    {isBottleneck ? <strong>BOTTLENECK</strong> : null}
                  </div>
                </div>
                <input id={`station-${index}`} aria-label={`${station.name} cycle time slider`} type="range" min="20" max="180" step="1" value={station.seconds} onChange={event => updateStation(index, event.target.value)} />
                <div className="line-station-scale"><span>20s</span><span>180s</span></div>
              </div>
            );
          })}
          <div className="line-sim-section-title line-sim-settings-title"><span>02 / SHIFT SETTINGS</span><small>EDIT THE ASSUMPTIONS</small></div>
          <div className="line-settings-grid">
            <label>Shift length <strong>{shiftHours} hours</strong><input type="range" min="4" max="12" step="1" value={shiftHours} onChange={event => setShiftHours(Number(event.target.value))}/></label>
            <label>Break time <strong>{breakMinutes} min</strong><input type="range" min="0" max="120" step="5" value={breakMinutes} onChange={event => setBreakMinutes(Number(event.target.value))}/></label>
            <label>Line availability <strong>{availability}%</strong><input type="range" min="50" max="100" step="1" value={availability} onChange={event => setAvailability(Number(event.target.value))}/></label>
            <label>Quality yield <strong>{yieldRate}%</strong><input type="range" min="70" max="100" step="1" value={yieldRate} onChange={event => setYieldRate(Number(event.target.value))}/></label>
            <label className="line-target-setting">Shift production target <strong>{target} vehicles</strong><input type="range" min="50" max="700" step="10" value={target} onChange={event => setTarget(Number(event.target.value))}/></label>
          </div>
        </div>

        <aside className="line-sim-results" aria-live="polite">
          <span className="eyebrow">LIVE SIMULATION RESULT</span>
          <div className="line-output-number"><strong>{result.goodUnits.toLocaleString("en-IN")}</strong><span>estimated good vehicles / shift</span></div>
          <div className="line-result-status">
            <span>{result.gap >= 0 ? "ABOVE TARGET" : "BELOW TARGET"}</span>
            <strong>{result.gap >= 0 ? "+" : ""}{result.gap.toLocaleString("en-IN")} vehicles</strong>
          </div>
          <div className="line-result-list">
            <div><span>Slowest station</span><strong>{result.bottleneckName}</strong></div>
            <div><span>Bottleneck cycle time</span><strong>{result.bottleneck} sec / vehicle</strong></div>
            <div><span>Net production time</span><strong>{result.netMinutes} minutes</strong></div>
            <div><span>Ideal line capacity</span><strong>{result.ideal} vehicles</strong></div>
            <div><span>After availability</span><strong>{result.available} vehicles</strong></div>
            <div><span>Good output per hour</span><strong>{result.hourly.toFixed(1)} vehicles</strong></div>
            <div><span>Target takt time · before losses</span><strong>{result.taktSeconds.toFixed(1)} sec / vehicle</strong></div>
          </div>
          <div className="line-target-meter">
            <div><span>OUTPUT VS TARGET</span><strong>{target > 0 ? Math.min(100, result.goodUnits / target * 100).toFixed(0) : 0}%</strong></div>
            <div className="line-target-track"><i style={{ width: `${target > 0 ? clamp(result.goodUnits / target * 100, 0, 100) : 0}%` }}/></div>
          </div>
          <div className="factory-chart-toolbar">
            <div><span className="eyebrow">LIVE PRODUCTION ANALYTICS</span><p>Four chart views update as you change the simulator settings.</p></div>
            <div className="factory-chart-actions">
              <button className="line-reset" type="button" onClick={exportSimulation}>Export CSV ↓</button>
              <button className="line-reset" type="button" aria-expanded={showDataTable} onClick={() => setShowDataTable(value => !value)}>{showDataTable ? "Hide data table −" : "View data table ≡"}</button>
              <button className="line-reset" type="button" aria-expanded={showImprovementPlanner} onClick={() => {
                if (!showImprovementPlanner) setProposedCycleTimes(stations.map(station => station.seconds));
                setShowImprovementPlanner(value => !value);
              }}>{showImprovementPlanner ? "Hide improvement planner −" : "Improve line ↗"}</button>
              <button className="line-reset" type="button" aria-expanded={chartEditMode} onClick={() => setChartEditMode(value => !value)}>{chartEditMode ? "Done editing ✓" : "Edit charts ⚙"}</button>
            </div>
          </div>
          {chartEditMode && (
            <div className="factory-chart-editor" aria-label="Edit chart visibility and titles">
              <div className="factory-chart-editor-heading"><strong>Customize chart view</strong><small>Show or hide charts and rename their headings.</small></div>
              {[
                ["radar", "01 / Radar chart"],
                ["capacity", "02 / Capacity rings"],
                ["ratios", "03 / Operating conditions"],
                ["losses", "04 / Loss analysis"]
              ].map(([key, label]) => (
                <div className="factory-chart-editor-row" key={key}>
                  <label className="factory-chart-toggle"><input type="checkbox" checked={chartVisibility[key]} onChange={event => setChartVisibility(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>
                  <input aria-label={label + " title"} type="text" maxLength={48} value={chartTitles[key]} onChange={event => setChartTitles(current => ({ ...current, [key]: event.target.value }))} />
                </div>
              ))}
              <button type="button" className="line-reset" onClick={() => { setChartVisibility({ radar: true, capacity: true, ratios: true, losses: true }); setChartTitles(defaultChartTitles); }}>Restore chart defaults</button>
            </div>
          )}
          {showImprovementPlanner && (
            <section className="factory-improvement-planner" aria-label="Station improvement planner">
              <div className="factory-improvement-heading">
                <div><span>WHAT-IF ANALYSIS / LINE BALANCING</span><h3>Test station improvements</h3><p>Enter a proposed cycle time for each station. Compare the projected shift output with the current simulation.</p></div>
                <div className="factory-improvement-actions">
                  <button type="button" className="line-reset" onClick={exportImprovementScenario}>Export scenario CSV ↓</button>
                  <button type="button" className="line-reset" onClick={copyScenarioSummary}>Copy summary</button>
                  <button type="button" className="line-reset" onClick={exportScenarioJson}>Export JSON ↓</button>
                  <button type="button" className="line-reset" onClick={() => scenarioFileInput.current?.click()}>Import JSON ↑</button>
                  <input ref={scenarioFileInput} type="file" accept=".json,application/json" onChange={importScenarioJson} className="sr-only" aria-label="Import factory improvement scenario JSON" />
                  <button type="button" className="line-reset" onClick={saveImprovementScenario}>Save scenario</button>
                  <button type="button" className="line-reset" onClick={loadImprovementScenario} disabled={!savedScenario}>Load saved</button>
                  <button type="button" className="line-reset" onClick={() => setProposedCycleTimes(stations.map(station => station.seconds))}>Copy current times</button>
                  <button type="button" className="line-reset" onClick={() => setProposedCycleTimes(stations.map((station, index) => Math.min(station.seconds, clamp(improvement.requiredCycle, 20, 180))))}>Apply target pace</button>
                </div>
              </div>
              {scenarioSaveMessage && <p className="factory-scenario-save-message" role="status">{scenarioSaveMessage}</p>}
              <div className="factory-named-scenarios">
                <label htmlFor="factoryScenarioName">Save a named version</label>
                <div className="factory-named-scenario-controls">
                  <input id="factoryScenarioName" type="text" maxLength="48" value={scenarioName} onChange={event => setScenarioName(event.target.value)} placeholder="e.g. Higher output target" />
                  <button type="button" className="line-reset" onClick={saveNamedScenario}>Save named scenario</button>
                </div>
                <small className="factory-scenario-capacity" aria-live="polite">{scenarioLibrary.length} of 10 named scenarios saved{scenarioLibrary.length >= 10 ? " · Library full — delete one to add another" : " · You can save up to 10"}</small>
                <div className="factory-scenario-library-actions">
                  <button type="button" className="line-reset" onClick={exportScenarioLibraryJson} disabled={scenarioLibrary.length === 0}>Export library JSON</button>
                  <button type="button" className="line-reset" onClick={exportScenarioLibraryCsv} disabled={scenarioLibrary.length === 0}>Export library CSV</button>
                  <button type="button" className="line-reset" onClick={() => scenarioLibraryFileInput.current?.click()}>Import library JSON</button>
                  <input ref={scenarioLibraryFileInput} type="file" accept=".json,application/json" aria-label="Import named scenario library JSON" onChange={importScenarioLibraryJson} hidden />
                </div>
                {scenarioLibrary.length > 0 && <>
                  <div className="factory-scenario-library-filter">
                    <label htmlFor="factoryScenarioSearch">Find a saved scenario</label>
                    <input id="factoryScenarioSearch" type="search" value={scenarioSearch} onChange={event => setScenarioSearch(event.target.value)} placeholder="Search scenario names..." />
                    {scenarioSearch && <button type="button" className="line-reset factory-scenario-clear-search" onClick={() => setScenarioSearch("")}>Clear search</button>}
                    <small>Showing {visibleScenarioLibrary.length} of {scenarioLibrary.length} saved scenarios</small>
                    <label className="factory-scenario-sort"><span>Sort</span><select value={scenarioSort} onChange={event => setScenarioSort(event.target.value)} aria-label="Sort saved scenarios"><option value="recent">Recently saved</option><option value="output">Highest output</option><option value="target">Best target result</option><option value="name">Name A–Z</option></select></label>
                  </div>
                  <ul aria-label="Saved named scenarios">
                  {visibleScenarioLibrary.map(item => <li key={item.name}>
                    <span className="factory-scenario-item-details">
                      {renamingScenario === item.name ? <span className="factory-scenario-rename"><label htmlFor={`rename-${item.name}`}>New scenario name</label><input id={`rename-${item.name}`} value={renameScenarioValue} maxLength={48} onChange={event => setRenameScenarioValue(event.target.value)} onKeyDown={event => { if (event.key === "Enter") renameNamedScenario(item.name); if (event.key === "Escape") setRenamingScenario(""); }} /><span><button type="button" className="line-reset" onClick={() => renameNamedScenario(item.name)}>Save name</button><button type="button" className="line-reset" onClick={() => setRenamingScenario("")}>Cancel</button></span></span> : <><strong>{item.name}</strong><small>{new Date(item.snapshot.savedAt).toLocaleString()} · target {item.snapshot.target}/shift</small><small>{getScenarioProjection(item.snapshot).good.toLocaleString("en-IN")} good vehicles/shift · bottleneck {getScenarioProjection(item.snapshot).bottleneckName} ({getScenarioProjection(item.snapshot).bottleneck}s)</small><small className={getScenarioProjection(item.snapshot).gap >= 0 ? "factory-named-on-target" : "factory-named-below-target"}>{getScenarioProjection(item.snapshot).gap >= 0 ? `Target met · ${getScenarioProjection(item.snapshot).gap} above` : `${Math.abs(getScenarioProjection(item.snapshot).gap)} below target`}</small><span className="mt-2 block max-w-sm"><span className="mb-1 flex items-center justify-between gap-2 text-xs"><span>Target attainment</span><strong>{getScenarioProjection(item.snapshot).attainmentPercent.toFixed(1)}%</strong></span><span className="block h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={`${item.name} target attainment`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, getScenarioProjection(item.snapshot).attainmentPercent)} aria-valuetext={`${getScenarioProjection(item.snapshot).attainmentPercent.toFixed(1)} percent of target`}><span className="block h-full rounded-full bg-teal-600 transition-[width]" style={{ width: `${clamp(getScenarioProjection(item.snapshot).attainmentPercent, 0, 100)}%` }} /></span></span></>}
                    </span>
                    <label className="factory-scenario-compare-choice"><input type="checkbox" checked={selectedScenarioNames.includes(item.name)} onChange={event => toggleScenarioComparison(item.name, event.target.checked)} aria-label={`Compare ${item.name}`} /> Compare</label>
                    {renamingScenario !== item.name && <button type="button" className="line-reset" onClick={() => { setRenamingScenario(item.name); setRenameScenarioValue(item.name); }}>Rename</button>}
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioJson(item)}>Export JSON</button>
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioCsv(item)}>Export CSV</button>
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioHtml(item)}>Export report</button>
                    <button type="button" className="line-reset" onClick={() => exportNamedScenarioMarkdown(item)}>Export Markdown</button>\n                    <button type="button" className="line-reset" onClick={() => copyNamedScenarioSummary(item)}>Copy summary</button>
                    <button type="button" className="line-reset" onClick={() => loadNamedScenario(item)}>Load</button>
                    <button type="button" className="line-reset" onClick={() => duplicateNamedScenario(item)} disabled={scenarioLibrary.length >= 10} aria-label={`Duplicate ${item.name}`}>Duplicate</button>
                    {pendingDeleteScenario === item.name ? <>
                      <span className="factory-scenario-delete-confirm" role="group" aria-label={`Confirm deletion of ${item.name}`}>
                        <small>Delete this saved scenario?</small>
                        <button type="button" className="line-reset factory-scenario-delete-action" onClick={() => deleteNamedScenario(item.name)}>Confirm delete</button>
                        <button type="button" className="line-reset" onClick={() => setPendingDeleteScenario("")}>Cancel</button>
                      </span>
                    </> : <button type="button" className="line-reset" onClick={() => { setPendingDeleteScenario(item.name); setRenamingScenario(""); }}>Delete</button>}
                  </li>)}
                </ul>
                  {scenarioLibrary.every(item => !item.name.toLowerCase().includes(scenarioSearch.trim().toLowerCase())) && <div className="factory-scenario-empty-search" role="status"><p>No saved scenarios match “{scenarioSearch}”.</p><button type="button" className="line-reset" onClick={() => setScenarioSearch("")}>Clear search and show all scenarios</button></div>}
                </>}
                {selectedScenarioNames.length > 0 && <div className="factory-scenario-comparison" aria-live="polite">
                  <div className="factory-scenario-comparison-heading"><strong>Scenario comparison ({selectedScenarioNames.length}/2)</strong><button type="button" className="line-reset" onClick={() => setSelectedScenarioNames([])}>Clear comparison</button></div>
                  {selectedScenarioNames.map(name => {
                    const item = scenarioLibrary.find(entry => entry.name === name);
                    if (!item) return null;
                    const projection = getScenarioProjection(item.snapshot);
                    return <div key={name}><span>{item.name}</span><strong>{projection.good.toLocaleString("en-IN")} good/shift</strong><small>{projection.bottleneckName} · {projection.bottleneck}s bottleneck · {projection.gap >= 0 ? `+${projection.gap} above target` : `${Math.abs(projection.gap)} below target`}</small><small>Target {item.snapshot.target}/shift · {item.snapshot.shiftHours}h shift · {item.snapshot.availability}% availability · {item.snapshot.yieldRate}% quality</small></div>;
                  })}
                  {selectedScenarioNames.length === 2 && (() => {
                    const first = scenarioLibrary.find(item => item.name === selectedScenarioNames[0]);
                    const second = scenarioLibrary.find(item => item.name === selectedScenarioNames[1]);
                    if (!first || !second) return null;
                    const firstProjection = getScenarioProjection(first.snapshot);
                    const secondProjection = getScenarioProjection(second.snapshot);
                    const difference = secondProjection.good - firstProjection.good;
                    const percentDifference = firstProjection.good > 0 ? (difference / firstProjection.good) * 100 : null;
                    const sameAssumptions = ["shiftHours", "breakMinutes", "availability", "yieldRate", "target"].every(key => first.snapshot[key] === second.snapshot[key]);
                    const commonConditions = {
                      shiftHours: first.snapshot.shiftHours,
                      breakMinutes: first.snapshot.breakMinutes,
                      availability: first.snapshot.availability,
                      yieldRate: first.snapshot.yieldRate,
                      target: first.snapshot.target
                    };
                    const normalizedFirst = getScenarioProjection({ ...first.snapshot, ...commonConditions });
                    const normalizedSecond = getScenarioProjection({ ...second.snapshot, ...commonConditions });
                    const normalizedDifference = normalizedSecond.good - normalizedFirst.good;
                    return <div className="factory-scenario-comparison-print">
                      <h3>Scenario comparison report</h3>
                      <p><strong>{difference > 0 ? `+${difference}` : difference} good vehicles/shift</strong> for {second.name} compared with {first.name}{percentDifference !== null ? ` (${percentDifference > 0 ? "+" : ""}${percentDifference.toFixed(1)}%)` : ""}.</p>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonCsv(first, second)}>Export comparison CSV</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonJson(first, second)}>Export comparison JSON</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonMarkdown(first, second)}>Export comparison Markdown</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => exportScenarioComparisonHtml(first, second)}>Export comparison HTML</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => copyScenarioComparisonSummary(first, second)}>Copy comparison summary</button>
                      <button type="button" className="line-reset factory-comparison-export" onClick={() => window.print()}>Print comparison report</button>
                      <small className={sameAssumptions ? "factory-scenario-comparison-fair" : "factory-scenario-comparison-warning"} role="status">{sameAssumptions ? "Like-for-like comparison: both scenarios use the same shift and production assumptions." : "Different assumptions detected. Output difference includes changes to shift time, breaks, availability, quality yield or target; compare cycle times separately for a fair line-performance assessment."}</small>
                      <div className="factory-scenario-normalized">
                        <strong>Cycle-time-only comparison</strong>
                        <p>Both cycle-time sets are recalculated using <b>{first.name}</b> conditions: {commonConditions.shiftHours}h shift, {commonConditions.breakMinutes} min breaks, {commonConditions.availability}% availability and {commonConditions.yieldRate}% quality.</p>
                        <div><span>{first.name}</span><strong>{normalizedFirst.good.toLocaleString("en-IN")} good/shift</strong></div>
                        <div><span>{second.name}</span><strong>{normalizedSecond.good.toLocaleString("en-IN")} good/shift</strong></div>
                        <small className={normalizedDifference > 0 ? "factory-cycle-faster" : normalizedDifference < 0 ? "factory-cycle-slower" : ""}>{normalizedDifference > 0 ? "+" : ""}{normalizedDifference} good vehicles/shift for {second.name} on the same operating assumptions.</small>
                      </div>
                      <div className="factory-scenario-station-compare">
                        <strong>Station cycle-time comparison</strong>
                        <div className="factory-scenario-station-compare-scroll" role="region" aria-label="Side-by-side station cycle time comparison" tabIndex="0">
                          <table>
                            <thead><tr><th>Station</th><th>{first.name}</th><th>{second.name}</th><th>Difference</th></tr></thead>
                            <tbody>{initialStations.map((station, index) => {
                              const firstTime = first.snapshot.cycleTimes[index];
                              const secondTime = second.snapshot.cycleTimes[index];
                              const delta = secondTime - firstTime;
                              return <tr key={station.name}>
                                <th scope="row">{station.name}</th>
                                <td>{firstTime}s</td>
                                <td>{secondTime}s</td>
                                <td className={delta < 0 ? "factory-cycle-faster" : delta > 0 ? "factory-cycle-slower" : ""}>{delta > 0 ? "+" : ""}{delta}s {delta < 0 ? "faster" : delta > 0 ? "slower" : "unchanged"}</td>
                              </tr>;
                            })}</tbody>
                          </table>
                        </div>
                        <small>Difference is calculated as {second.name} minus {first.name}. A negative value means the second scenario has a faster station cycle.</small>
                      </div>
                    </div>;
                  })()}
                </div>}
                <p>Up to 10 named scenarios are stored in this browser. They remain separate from the single quick-save slot above.</p>
              </div>

              {scenarioStorageReady && <div className="factory-scenario-saved-state" role="status">
                {savedScenario ? <>
                  <div className="factory-saved-scenario-summary">
                    <strong>Saved scenario · {new Date(savedScenario.savedAt).toLocaleString()}</strong>
                    <span>{savedScenarioSummary.good.toLocaleString("en-IN")} good vehicles / shift</span>
                    <span>{savedScenarioSummary.bottleneck}s bottleneck cycle</span>
                    <span className={savedScenarioSummary.meetsTarget ? "is-on-target" : "is-below-target"}>{savedScenarioSummary.meetsTarget ? `Target met · ${savedScenarioSummary.gap} above target` : `${Math.abs(savedScenarioSummary.gap)} below target`}</span>
                      <small>Target: {savedScenario.target} · Shift: {savedScenario.shiftHours}h · Availability: {savedScenario.availability}% · Quality: {savedScenario.yieldRate}%</small>
                    <span className={savedScenarioChanged ? "factory-saved-change" : "factory-saved-current"}>{savedScenarioChanged ? "Planner has unsaved changes" : "Planner matches saved scenario"}</span>
                    <span className={improvement.good - savedScenarioSummary.good > 0 ? "factory-saved-delta-up" : improvement.good - savedScenarioSummary.good < 0 ? "factory-saved-delta-down" : "factory-saved-delta-even"}>Current planner vs saved: {improvement.good - savedScenarioSummary.good > 0 ? "+" : ""}{(improvement.good - savedScenarioSummary.good).toLocaleString("en-IN")} good vehicles / shift</span>
                  </div>
                  <button type="button" onClick={clearImprovementScenario}>Clear saved scenario</button>
                </> : <span>No saved scenario yet. Save proposed cycle times and shift assumptions to reuse them later on this device.</span>}
              </div>}
              <div className="factory-improvement-grid">
                {stations.map((station, index) => (
                  <label className="factory-improvement-row" key={station.name}>
                    <span>{station.name}</span>
                    <small>Current: {station.seconds}s</small>
                    <div className="factory-proposed-cycle-control">
                      <input className="factory-proposed-cycle-slider" aria-label={`Proposed cycle time slider for ${station.name}`} type="range" min="20" max="180" step="1" value={proposedCycleTimes[index] ?? station.seconds} onChange={event => {
                        const value = Number(event.target.value);
                        setProposedCycleTimes(current => current.map((time, i) => i === index ? value : time));
                      }}/>
                      <div className="factory-proposed-cycle-number"><input aria-label={`Proposed cycle time for ${station.name}`} type="number" min="20" max="180" step="1" value={proposedCycleTimes[index] ?? station.seconds} onChange={event => {
                        const value = event.target.value;
                        if (value !== "" && Number(value) >= 20 && Number(value) <= 180) {
                          setProposedCycleTimes(current => current.map((time, i) => i === index ? Number(value) : time));
                        }
                      }}/><span>sec</span></div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="factory-improvement-guidance">
                <div><span>Required bottleneck cycle to meet target</span><strong>{improvement.requiredCycle > 0 ? improvement.requiredCycle : "—"} sec</strong></div>
                <p>{improvement.feasible ? "Stations above this cycle time need improvement to reach the selected good-output target." : "The selected target cannot be reached within the simulator's 20-second minimum cycle time under the current shift, availability and quality settings."}</p>
              </div>
              <div className="factory-improvement-priority" aria-label="Station improvement priority ranking">
                <div className="factory-improvement-guidance-title"><strong>Improvement priority</strong><span>Ranked by cycle-time gap against the target pace</span></div>
                <ol>
                  {improvementPriorities.map((station, rank) => (
                    <li key={station.name}>
                      <span className="factory-priority-rank">{String(rank + 1).padStart(2, "0")}</span>
                      <div><strong>{station.name}</strong><small>Current {station.seconds}s · Proposed {proposedCycleTimes[station.index] ?? station.seconds}s</small></div>
                      <b>{station.reductionNeeded > 0 ? `${station.reductionNeeded}s above target pace` : "At target pace"}</b>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="factory-improvement-grid factory-improvement-detail-grid">
                {stations.map((station, index) => {
                  const proposed = proposedCycleTimes[index] ?? station.seconds;
                  const reduction = station.seconds - proposed;
                  const abovePace = improvement.requiredCycle > 0 ? Math.max(0, proposed - improvement.requiredCycle) : null;
                  const meetsPace = improvement.feasible && abovePace === 0;
                  return <div className="factory-improvement-detail" key={station.name}>
                    <strong>{station.name}</strong>
                    <span>Current {station.seconds}s <span aria-hidden="true">→</span> Proposed {proposed}s</span>
                    <span className={reduction > 0 ? "factory-detail-gain" : reduction < 0 ? "factory-detail-loss" : ""}>{reduction > 0 ? `Improved by ${reduction}s` : reduction < 0 ? `Increased by ${Math.abs(reduction)}s` : "No cycle-time change"}</span>
                    <span className={meetsPace ? "factory-detail-on-pace" : "factory-detail-over-pace"}>{!improvement.feasible ? "Target pace unavailable" : meetsPace ? "Meets target pace" : `${abovePace}s above target pace`}</span>
                  </div>;
                })}
              </div>
              <div className="factory-improvement-results">
                <div><span>Projected good output</span><strong>{improvement.good.toLocaleString("en-IN")}</strong><small>vehicles / shift</small></div>
                <div><span>Projected bottleneck</span><strong>{improvement.bottleneckName}</strong><small>{improvement.bottleneck}s per vehicle</small></div>
                <div className={improvement.gain > 0 ? "is-positive" : improvement.gain < 0 ? "is-negative" : ""}><span>Change vs current</span><strong>{improvement.gain > 0 ? "+" : ""}{improvement.gain.toLocaleString("en-IN")}</strong><small>good vehicles / shift</small></div>
              </div>
              <div className={`factory-scenario-target ${improvement.meetsTarget ? "is-met" : "is-short"}`} role="status" aria-live="polite">
                <div><span>SCENARIO TARGET CHECK</span><strong>{improvement.meetsTarget ? "Target achieved" : "Target not yet achieved"}</strong></div>
                <b>{improvement.targetGap > 0 ? "+" : ""}{improvement.targetGap.toLocaleString("en-IN")} vehicles</b>
                <small>{improvement.meetsTarget ? "Projected good output meets or exceeds the selected shift target." : "Additional good vehicles are needed to reach the selected shift target."}</small>
              </div>
              <p className="factory-chart-caption">Target cycle time is calculated from net shift seconds, availability, quality yield and the selected good-output target. Apply target pace creates a what-if scenario; it does not change the live station settings.</p>
            </section>
          )}
          <div className="factory-live-charts grid grid-cols-1 2xl:grid-cols-2 gap-3 mt-5">
            {chartVisibility.radar && (<section className="factory-chart-card min-w-0" aria-label="Station cycle time radar chart">
              <div className="factory-chart-heading"><div><span>CHART 01 / LINE BALANCE</span><h3>{chartTitles.radar || defaultChartTitles.radar}</h3></div><small>Seconds / vehicle</small></div>
              <div className="factory-radar-wrap">
                <svg className="factory-radar" viewBox="0 0 320 250" role="img" aria-label="Radar plot comparing the cycle time of each production station">
                  {[25,50,75,100].map(level=>{const r=level*0.78;return <g key={level}><polygon points={stations.map((_,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);return (160+Math.cos(a)*r)+","+(118+Math.sin(a)*r)}).join(" ")} /><text className="factory-radar-scale" x="164" y={118-r-3}>{Math.round(level*1.8)}s</text></g>})}
                  {stations.map((station,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);return <line key={station.name} x1="160" y1="118" x2={160+Math.cos(a)*78} y2={118+Math.sin(a)*78}/>})}
                  <polygon className="factory-radar-area" points={stations.map((station,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);const r=station.seconds/180*78;return (160+Math.cos(a)*r)+","+(118+Math.sin(a)*r)}).join(" ")}/>
                  {stations.map((station,i)=>{const a=(-Math.PI/2)+(i*2*Math.PI/stations.length);const r=station.seconds/180*78;const x=160+Math.cos(a)*r;const y=118+Math.sin(a)*r;const lx=160+Math.cos(a)*105;const ly=118+Math.sin(a)*105;return <g key={station.name}><circle className={station.seconds===result.bottleneck?"factory-radar-point bottleneck":"factory-radar-point"} cx={x} cy={y} r="4"/><text x={lx} y={ly} textAnchor={Math.abs(Math.cos(a))<.25?"middle":Math.cos(a)>0?"start":"end"}>{station.name}</text></g>})}
                </svg>
              </div>
              <p className="factory-chart-caption">Each axis represents one station. Points farther from the centre have longer cycle times; the highlighted point is the bottleneck.</p>
            </section>)}
            {chartVisibility.capacity && (<section className="factory-chart-card min-w-0" aria-label="Production capacity radial comparison">
              <div className="factory-chart-heading"><div><span>CHART 02 / OUTPUT CAPACITY</span><h3>{chartTitles.capacity || defaultChartTitles.capacity}</h3></div><small>Vehicles / shift</small></div>
              <div className="factory-capacity-rings">
                {[{label:"Ideal",value:result.ideal,color:"ideal"},{label:"Available",value:result.available,color:"available"},{label:"Good units",value:result.goodUnits,color:"good"},{label:"Target",value:target,color:"target"}].map(item=><div className="factory-capacity-item" key={item.label}><div className={`factory-capacity-ring ${item.color}`} style={{"--ratio":(Math.max(result.ideal,target,1)>0?clamp(item.value/Math.max(result.ideal,target,1)*100,0,100):0)+"%"}}><strong>{item.value.toLocaleString("en-IN")}</strong></div><span>{item.label}</span></div>)}
              </div>
              <p className="factory-chart-caption">Each ring shows its value relative to the larger of ideal capacity and the selected target.</p>
            </section>)}
            {chartVisibility.ratios && (<section className="factory-chart-card factory-efficiency-card min-w-0 2xl:col-span-2" aria-label="Availability and quality yield chart">
              <div className="factory-chart-heading"><div><span>CHART 03 / OPERATING CONDITIONS</span><h3>{chartTitles.ratios || defaultChartTitles.ratios}</h3></div><small>Current assumptions</small></div>
              <div className="factory-ratio-charts">
                <div className="factory-ratio-item"><div className="factory-ratio-ring availability" role="img" aria-label={`Line availability ${availability} percent`} style={{"--ratio":availability+"%"}}><strong>{availability}%</strong></div><div><b>Line availability</b><p>Share of scheduled production time assumed available to run.</p></div></div>
                <div className="factory-ratio-item"><div className="factory-ratio-ring yield" role="img" aria-label={`Quality yield ${yieldRate} percent`} style={{"--ratio":yieldRate+"%"}}><strong>{yieldRate}%</strong></div><div><b>Quality yield</b><p>Share of produced units assumed to pass quality checks.</p></div></div>
              </div>
            </section>)}
            {chartVisibility.losses && (<section className="factory-chart-card factory-loss-card min-w-0 2xl:col-span-2" aria-label="Production loss doughnut chart">
              <div className="factory-chart-heading"><div><span>CHART 04 / LOSS ANALYSIS</span><h3>{chartTitles.losses || defaultChartTitles.losses}</h3></div><small>Vehicles / shift</small></div>
              <div className="factory-loss-layout">
                <div className="factory-loss-donut" role="img" aria-label={`Capacity split: ${Math.max(0,result.ideal-result.available)} availability loss, ${Math.max(0,result.available-result.goodUnits)} quality loss, ${result.goodUnits} good output`} style={{"--availability-share":(result.ideal>0?Math.max(0,result.ideal-result.available)/result.ideal*100:0)+"%","--quality-share":(result.ideal>0?Math.max(0,result.available-result.goodUnits)/result.ideal*100:0)+"%"}}><div><strong>{result.ideal.toLocaleString("en-IN")}</strong><span>ideal units</span></div></div>
                <div className="factory-loss-legend">
                  {[{label:"Availability loss",value:Math.max(0,result.ideal-result.available),tone:"availability"},{label:"Quality loss",value:Math.max(0,result.available-result.goodUnits),tone:"quality"},{label:"Good output",value:result.goodUnits,tone:"output"}].map(item=><div key={item.label}><i className={item.tone}/><span>{item.label}</span><b>{item.value.toLocaleString("en-IN")}</b></div>)}
                </div>
              </div>
              <p className="factory-chart-caption">Losses are calculated from the simulator's ideal capacity, availability and quality-yield assumptions. They are estimates, not measured factory data.</p>
            </section>)}
          </div>
          {showDataTable && (
            <section className="factory-data-table-wrap" aria-label="Detailed simulation data">
              <div className="factory-data-table-heading"><div><span>SIMULATION DATA / LIVE VALUES</span><strong>Production breakdown</strong></div><small>Updates with every setting change</small></div>
              <div className="factory-data-table-scroll" role="region" aria-label="Scrollable production data table" tabIndex="0">
                <table className="factory-data-table">
                  <thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">How it is used</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Ideal capacity</th><td>{result.ideal.toLocaleString("en-IN")} vehicles</td><td>Net shift seconds ÷ slowest station cycle time</td></tr>
                    <tr><th scope="row">Available capacity</th><td>{result.available.toLocaleString("en-IN")} vehicles</td><td>Ideal capacity × line availability</td></tr>
                    <tr><th scope="row">Estimated good output</th><td>{result.goodUnits.toLocaleString("en-IN")} vehicles</td><td>Available capacity × quality yield</td></tr>
                    <tr><th scope="row">Availability loss</th><td>{Math.max(0,result.ideal-result.available).toLocaleString("en-IN")} vehicles</td><td>Ideal capacity − available capacity</td></tr>
                    <tr><th scope="row">Quality loss</th><td>{Math.max(0,result.available-result.goodUnits).toLocaleString("en-IN")} vehicles</td><td>Available capacity − good output</td></tr>
                    <tr><th scope="row">Target variance</th><td>{result.gap > 0 ? "+" : ""}{result.gap.toLocaleString("en-IN")} vehicles</td><td>Estimated good output − shift target</td></tr>
                    <tr><th scope="row">Target takt time</th><td>{result.taktSeconds.toFixed(1)} seconds / vehicle</td><td>Net production seconds ÷ shift target; pace before downtime and quality losses</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="factory-data-table-heading factory-station-table-heading"><div><span>STATION DETAIL</span><strong>Cycle-time comparison</strong></div><small>Longest cycle time sets line pace</small></div>
              <div className="factory-data-table-scroll" role="region" aria-label="Scrollable station cycle time table" tabIndex="0">
                <table className="factory-data-table">
                  <thead><tr><th scope="col">Station</th><th scope="col">Cycle time</th><th scope="col">Target pace check</th></tr></thead>
                  <tbody>{stations.map(station => <tr key={station.name}><th scope="row">{station.name}</th><td>{station.seconds} sec / vehicle</td><td>{station.seconds > result.taktSeconds ? <span className="factory-bottleneck-label">Exceeds takt</span> : station.seconds === result.bottleneck ? <span className="factory-bottleneck-label">Bottleneck · within takt</span> : "Within takt"}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}
          <p className="line-sim-tip">{result.taktSeconds > 0 && result.bottleneck > result.taktSeconds ? `The bottleneck cycle time is ${(result.bottleneck - result.taktSeconds).toFixed(1)} seconds slower than target takt. The line needs a faster cycle or more net production time to meet the selected target.` : "All station cycle times are at or below target takt before downtime and quality losses."}</p>
        </aside>
      </div>
      <p className="line-sim-disclaimer">Simplified educational model. It assumes a serial line whose throughput is limited by the slowest station. Real factories also account for buffers, parallel workstations, changeovers, downtime patterns, material shortages, rework, staffing and product mix. Results are estimates, not Ford plant data or production guarantees.</p>
    </section>,
    mount
  );
}
