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
      hourly: netMinutes > 0 ? goodUnits / (netMinutes / 60) : 0
    };
  }, [stations, shiftHours, breakMinutes, availability, yieldRate, target]);

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
      [],
      ["Station", "Cycle time (seconds)", "Bottleneck"],
      ...stations.map(station => [station.name, station.seconds, station.seconds === result.bottleneck ? "Yes" : "No"])
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
                  <strong>{station.seconds}s {isBottleneck ? <span>BOTTLENECK</span> : null}</strong>
                </div>
                <input id={`station-${index}`} type="range" min="20" max="180" step="1" value={station.seconds} onChange={event => updateStation(index, event.target.value)} />
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
                  </tbody>
                </table>
              </div>
              <div className="factory-data-table-heading factory-station-table-heading"><div><span>STATION DETAIL</span><strong>Cycle-time comparison</strong></div><small>Longest cycle time sets line pace</small></div>
              <div className="factory-data-table-scroll" role="region" aria-label="Scrollable station cycle time table" tabIndex="0">
                <table className="factory-data-table">
                  <thead><tr><th scope="col">Station</th><th scope="col">Cycle time</th><th scope="col">Line status</th></tr></thead>
                  <tbody>{stations.map(station => <tr key={station.name}><th scope="row">{station.name}</th><td>{station.seconds} sec / vehicle</td><td>{station.seconds === result.bottleneck ? <span className="factory-bottleneck-label">Bottleneck</span> : "Within current line pace"}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}
          <p className="line-sim-tip">{result.gap < 0 ? `The ${result.bottleneckName} station limits the line. Reducing its cycle time or improving line balance can increase theoretical output.` : "The estimated good output meets the selected shift target under these assumptions."}</p>
        </aside>
      </div>
      <p className="line-sim-disclaimer">Simplified educational model. It assumes a serial line whose throughput is limited by the slowest station. Real factories also account for buffers, parallel workstations, changeovers, downtime patterns, material shortages, rework, staffing and product mix. Results are estimates, not Ford plant data or production guarantees.</p>
    </section>,
    mount
  );
}
