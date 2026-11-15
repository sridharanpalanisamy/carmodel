"use client";

import { useMemo, useState } from "react";

const references = [
  { name: "Model T", year: "1908 reference", engine: "2.9 L inline-4", capacity: 2.9, power: 20, torque: 83, transmission: "2-speed planetary", drive: "Rear-wheel drive", note: "Launch-era reference; output and equipment changed during 1908–1927." },
  { name: "Model A", year: "1928–1931 reference", engine: "3.3 L inline-4", capacity: 3.3, power: 40, torque: 128, transmission: "3-speed manual", drive: "Rear-wheel drive", note: "Typical late Model A reference." },
  { name: "Ford V8", year: "1932 reference", engine: "3.6 L flathead V8", capacity: 3.6, power: 65, torque: 147, transmission: "3-speed manual", drive: "Rear-wheel drive", note: "Launch-era 221 cu in flathead V8." },
  { name: "Deluxe Coupe", year: "1940 reference", engine: "3.6 L flathead V8", capacity: 3.6, power: 85, torque: 157, transmission: "3-speed manual", drive: "Rear-wheel drive", note: "Representative 1940 Deluxe 85-series coupe." },
  { name: "Thunderbird", year: "1955 reference", engine: "4.8 L Y-block V8", capacity: 4.8, power: 193, torque: 280, transmission: "3-speed manual / Ford-O-Matic", drive: "Rear-wheel drive", note: "Launch-year 292 cu in V8; output varies by transmission." },
  { name: "F-100", year: "1953 reference", engine: "3.5 L inline-6", capacity: 3.5, power: 101, torque: null, transmission: "3-speed manual", drive: "Rear-wheel drive", note: "First F-100 model year; optional V8 had different figures." },
  { name: "Bronco", year: "1966 reference", engine: "2.8 L inline-6", capacity: 2.8, power: 105, torque: null, transmission: "3-speed manual", drive: "Four-wheel drive", note: "Launch-year 170 cu in six-cylinder reference." },
  { name: "Mustang", year: "1965 reference", engine: "4.7 L V8 (Hi-Po option)", capacity: 4.7, power: 271, torque: 312, transmission: "4-speed manual (Hi-Po reference)", drive: "Rear-wheel drive", note: "289 Hi-Po V8 option; other 1965 engines had lower outputs." },
  { name: "GT40", year: "1966 Mk I reference", engine: "4.7 L V8", capacity: 4.7, power: 335, torque: null, transmission: "5-speed manual transaxle", drive: "Mid-engine, rear-wheel drive", note: "Representative Mk I specification; race preparation varied." },
  { name: "Falcon", year: "1960 reference", engine: "2.4 L inline-6", capacity: 2.4, power: 90, torque: null, transmission: "3-speed manual", drive: "Rear-wheel drive", note: "First-generation US 144 cu in six; other markets and engines differed." },
  { name: "Pinto", year: "1971 reference", engine: "1.6 L inline-4", capacity: 1.6, power: 75, torque: 96, transmission: "4-speed manual", drive: "Rear-wheel drive", note: "Launch-year 1.6 L reference using period gross rating." }
];

const metricMax = { capacity: 5, power: 350, torque: 350 };
const formatMetric = (value, unit) => value == null ? "Not available" : `${value.toLocaleString("en-US")} ${unit}`;

export default function VehicleSpecificationDashboard() {
  const [leftName, setLeftName] = useState("Model T");
  const [rightName, setRightName] = useState("Mustang");
  const left = useMemo(() => references.find(item => item.name === leftName) || references[0], [leftName]);
  const right = useMemo(() => references.find(item => item.name === rightName) || references[1], [rightName]);
  const metrics = [
    { key: "capacity", label: "Engine displacement", unit: "L", format: v => formatMetric(v, "L") },
    { key: "power", label: "Engine power", unit: "hp", format: v => formatMetric(v, "hp") },
    { key: "torque", label: "Torque", unit: "lb-ft", format: v => formatMetric(v, "lb-ft") }
  ];
  const specs = [
    ["Reference year", "year"], ["Engine", "engine"], ["Transmission", "transmission"], ["Drivetrain", "drive"]
  ];
  return (
    <section className="spec-dashboard" id="spec-dashboard" aria-labelledby="specDashboardTitle">
      <div className="spec-dashboard-heading">
        <div><span className="eyebrow">INTERACTIVE VEHICLE DATA</span><h2 id="specDashboardTitle">Compare the <em>specifications.</em></h2><p>Put two Ford icons side by side and explore their reference engine and performance figures.</p></div>
        <span className="spec-dashboard-index">DATA / 01</span>
      </div>
      <div className="spec-dashboard-selectors">
        <label><span>VEHICLE A</span><select value={leftName} onChange={event => setLeftName(event.target.value)}>{references.map(item => <option key={item.name} value={item.name}>Ford {item.name}</option>)}</select></label>
        <span className="spec-versus">VS</span>
        <label><span>VEHICLE B</span><select value={rightName} onChange={event => setRightName(event.target.value)}>{references.map(item => <option key={item.name} value={item.name}>Ford {item.name}</option>)}</select></label>
        <button type="button" className="spec-swap" onClick={() => { setLeftName(rightName); setRightName(leftName); }}>Swap vehicles ↔</button>
      </div>
      <div className="spec-vehicle-heads">
        {[left, right].map((item, index) => <div className="spec-vehicle-head" key={index}><span>0{index + 1} / {item.year}</span><h3>Ford {item.name}</h3><p>{item.engine}</p></div>)}
      </div>
      <div className="spec-chart-grid">
        {metrics.map(metric => {
          const a = left[metric.key], b = right[metric.key], max = metricMax[metric.key];
          return <article className="spec-chart" key={metric.key}>
            <div className="spec-chart-title"><span>{metric.label}</span><strong>{metric.unit}</strong></div>
            <div className="spec-bar-row"><span className="spec-bar-name">{left.name}</span><div className="spec-bar-track"><i style={{ width: a == null ? "0%" : `${Math.max(3, a / max * 100)}%` }} /></div><b>{metric.format(a)}</b></div>
            <div className="spec-bar-row"><span className="spec-bar-name">{right.name}</span><div className="spec-bar-track"><i className="spec-bar-alt" style={{ width: b == null ? "0%" : `${Math.max(3, b / max * 100)}%` }} /></div><b>{metric.format(b)}</b></div>
          </article>;
        })}
      </div>
      <div className="spec-table-wrap"><table className="spec-comparison-table"><thead><tr><th>SPECIFICATION</th><th>FORD {left.name.toUpperCase()}</th><th>FORD {right.name.toUpperCase()}</th></tr></thead><tbody>{specs.map(([label, key]) => <tr key={key}><th scope="row">{label}</th><td>{left[key]}</td><td>{right[key]}</td></tr>)}{metrics.map(metric => <tr key={metric.key}><th scope="row">{metric.label}</th><td>{metric.format(left[metric.key])}</td><td>{metric.format(right[metric.key])}</td></tr>)}</tbody></table></div>
      <div className="spec-data-notes"><strong>About these figures</strong><p>These are representative historical configurations, not universal specifications for every vehicle carrying the same name. Engine options, ratings, body styles and equipment varied by model year, market and trim. Torque is shown only where a reference value is available. Dimensions and top speed are intentionally excluded until matching year-specific data can be verified.</p><p>Currently includes 11 reference configurations. Other nameplates in the A–Z directory will be added as reliable year-specific specifications are verified.</p></div>
    </section>
  );
}
