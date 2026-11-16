"use client";

import { useEffect, useMemo, useState } from "react";
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
      requiredCycle,
      feasible: target === 0 || requiredCycle >= 20
    };
  }, [proposedCycleTimes, result.netMinutes, result.goodUnits, availability, yieldRate, stations, target]);

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
      return /[",\\n]/.test(cell) ? '"' + cell.replace(/"/g, '""') + '"' : cell;
    }).join(",")).join("\\n");
    const blob = new Blob(["\\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
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
    setShiftHours(8);
    setBreakMinutes(40);
    setAvailability(90);
    setYieldRate(97);
    setTarget(350);
    setChartVisibility({ radar: true, capacity: true, ratios: true, losses: true });
    setChartTitles(defaultChartTitles);
    setChartEditMode(false);
  }

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
                  <button type="button" className="line-reset" onClick={() => setProposedCycleTimes(stations.map(station => station.seconds))}>Copy current times</button>
                  <button type="button" className="line-reset" onClick={() => setProposedCycleTimes(stations.map((station, index) => Math.min(station.seconds, clamp(improvement.requiredCycle, 20, 180))))}>Apply target pace</button>
                </div>
              </div>
              <div className="factory-improvement-grid">
                {stations.map((station, index) => (
                  <label className="factory-improvement-row" key={station.name}>
                    <span>{station.name}</span>
                    <small>Current: {station.seconds}s</small>
                    <div><input aria-label={`Proposed cycle time for ${station.name}`} type="number" min="20" max="180" step="1" value={proposedCycleTimes[index] ?? station.seconds} onChange={event => {
                      const value = event.target.value;
                      if (value !== "" && Number(value) >= 20 && Number(value) <= 180) {
                        setProposedCycleTimes(current => current.map((time, i) => i === index ? Number(value) : time));
                      }
                    }}/><span>sec</span></div>
                  </label>
                ))}
              </div>
              <div className="factory-improvement-guidance">
                <div><span>Required bottleneck cycle to meet target</span><strong>{improvement.requiredCycle > 0 ? improvement.requiredCycle : "—"} sec</strong></div>
                <p>{improvement.feasible ? "Stations above this cycle time need improvement to reach the selected good-output target." : "The selected target cannot be reached within the simulator's 20-second minimum cycle time under the current shift, availability and quality settings."}</p>
              </div>
              <div className="factory-improvement-grid factory-improvement-detail-grid">
                {stations.map((station, index) => {
                  const proposed = proposedCycleTimes[index] ?? station.seconds;
                  const reduction = Math.max(0, station.seconds - proposed);
                  return <div className="factory-improvement-detail" key={station.name}>
                    <strong>{station.name}</strong>
                    <span>{proposed > improvement.requiredCycle ? `Still needs ${proposed - Math.max(20, improvement.requiredCycle)}s reduction` : reduction > 0 ? `Scenario reduces cycle by ${reduction}s` : "At or below target pace"}</span>
                  </div>;
                })}
              </div>
              <div className="factory-improvement-results">
                <div><span>Projected good output</span><strong>{improvement.good.toLocaleString("en-IN")}</strong><small>vehicles / shift</small></div>
                <div><span>Projected bottleneck</span><strong>{improvement.bottleneckName}</strong><small>{improvement.bottleneck}s per vehicle</small></div>
                <div className={improvement.gain > 0 ? "is-positive" : improvement.gain < 0 ? "is-negative" : ""}><span>Change vs current</span><strong>{improvement.gain > 0 ? "+" : ""}{improvement.gain.toLocaleString("en-IN")}</strong><small>good vehicles / shift</small></div>
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
