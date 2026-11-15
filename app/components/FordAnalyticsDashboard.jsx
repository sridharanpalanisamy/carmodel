"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { references } from "./VehicleSpecificationDashboard";

const palette = ["#b85e3b", "#596879", "#c89b69", "#718a7d", "#8b718e"];
const yearFrom = item => Number((item.year.match(/\\d{4}/) || [])[0]) || null;
const shortName = name => name.length > 13 ? name.slice(0, 12) + "…" : name;

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  const segments = data.map((item, index) => {
    const length = item.value / total * 100;
    const segment = { ...item, color: palette[index % palette.length], offset, length };
    offset += length;
    return segment;
  });
  return <div className="ford-donut-layout">
    <div className="ford-donut-graphic"><div className="ford-donut-ring" style={{background:`conic-gradient(${segments.map(item=>item.color+" "+item.offset+"% "+(item.offset+item.length)+"%").join(",")})`}}/><div className="ford-donut-centre"><b>{data.reduce((s,x)=>s+x.value,0)}</b><small>VEHICLES</small></div></div>
    <div className="ford-chart-legend">{segments.map(item=><div key={item.label}><i style={{background:item.color}}/><span>{item.label}</span><b>{item.value}</b></div>)}</div>
  </div>;
}

function PowerBars({ data }) {
  const max = Math.max(...data.map(item=>item.power));
  return <div className="ford-power-bars">{data.map((item,index)=><div className="ford-power-row" key={item.name}><span title={item.name}>{shortName(item.name)}</span><div className="ford-power-track"><i style={{width:(item.power/max*100)+"%",background:palette[index%palette.length]}}/></div><b>{item.power}</b></div>)}</div>;
}

function TorqueLollipops({ data }) {
  const max = 350;
  return <div className="ford-torque-chart"><div className="ford-torque-axis"><span>0</span><span>175</span><span>350 lb-ft</span></div>{data.map((item,index)=><div className="ford-torque-row" key={item.name}><span>{shortName(item.name)}</span><div className="ford-torque-track"><i style={{left:(item.torque/max*100)+"%",background:palette[index%palette.length]}}/></div><b>{item.torque}</b></div>)}</div>;
}

function EraScatter({ data }) {
  const points=data.filter(item=>item.power!=null&&yearFrom(item));
  const minYear=Math.min(...points.map(yearFrom)), maxYear=Math.max(...points.map(yearFrom));
  const x=year=>42+(year-minYear)/(maxYear-minYear||1)*480;
  const y=power=>166-power/350*135;
  return <div className="ford-scatter-wrap"><svg viewBox="0 0 550 205" role="img" aria-label="Scatter plot of reference year and horsepower"><line x1="42" y1="166" x2="526" y2="166" stroke="#cfc5be"/><line x1="42" y1="25" x2="42" y2="166" stroke="#cfc5be"/>{[0,100,200,300].map(v=><g key={v}><line x1="42" x2="526" y1={y(v)} y2={y(v)} stroke="#e9e2dd" strokeDasharray="3 4"/><text x="32" y={y(v)+3} textAnchor="end" fontSize="9" fill="#8c7d74">{v}</text></g>)}{points.map((item,index)=><g key={item.name}><circle cx={x(yearFrom(item))} cy={y(item.power)} r="5.5" fill={palette[index%palette.length]} stroke="#fff" strokeWidth="1.5"><title>{item.name}: {yearFrom(item)}, {item.power} hp</title></circle><text x={x(yearFrom(item))} y={y(item.power)-9} textAnchor="middle" fontSize="8" fill="#665850">{item.name}</text></g>)}<text x="284" y="197" textAnchor="middle" fontSize="9" fill="#8c7d74">Reference year</text><text x="10" y="15" fontSize="9" fill="#8c7d74">HP</text></svg><div className="ford-scatter-foot"><span>{minYear}</span><span>{maxYear}</span></div></div>;
}

export default function FordAnalyticsDashboard() {
  const [mount,setMount]=useState(null);
  useEffect(()=>setMount(document.getElementById("specAnalyticsMount")),[]);
  const powerData=useMemo(()=>[...references].filter(x=>x.power!=null).sort((a,b)=>b.power-a.power),[]);
  const torqueData=useMemo(()=>[...references].filter(x=>x.torque!=null).sort((a,b)=>b.torque-a.torque),[]);
  const drivetrainData=useMemo(()=>{const counts={};references.forEach(item=>{const key=item.drive.includes("Four-wheel")?"4WD":item.drive.includes("Mid-engine")?"Mid-engine RWD":"RWD";counts[key]=(counts[key]||0)+1;});return Object.entries(counts).map(([label,value])=>({label,value}));},[]);
  if(!mount)return null;
  return createPortal(<section className="ford-analytics-board" aria-labelledby="fordAnalyticsTitle">
    <div className="ford-analytics-heading"><div><span className="eyebrow">REFERENCE DATA / VISUAL ANALYTICS</span><h3 id="fordAnalyticsTitle">Performance at a <em>glance.</em></h3><p>Four different chart views built from the reference configurations currently documented in this dashboard.</p></div><span className="ford-analytics-count">11 REFERENCE VEHICLES</span></div>
    <div className="ford-analytics-grid">
      <article className="ford-analytics-card ford-analytics-wide"><header><div><small>01 / RANKING</small><h4>Power output ranking</h4></div><span>HORSEPOWER</span></header><PowerBars data={powerData}/><p>Sorted from highest to lowest published reference output.</p></article>
      <article className="ford-analytics-card"><header><div><small>02 / DISTRIBUTION</small><h4>Drivetrain mix</h4></div><span>CONFIGURATION</span></header><DonutChart data={drivetrainData}/><p>Grouped by the documented drivetrain layout.</p></article>
      <article className="ford-analytics-card"><header><div><small>03 / RELATIONSHIP</small><h4>Era vs. power</h4></div><span>YEAR / HP</span></header><EraScatter data={references}/><p>Each point represents one reference configuration; this is not a production-volume chart.</p></article>
      <article className="ford-analytics-card ford-analytics-wide"><header><div><small>04 / TORQUE PROFILE</small><h4>Torque comparison</h4></div><span>LB-FT</span></header><TorqueLollipops data={torqueData}/><p>Only configurations with a documented reference torque value are included.</p></article>
    </div>
    <div className="ford-analytics-note">Historical reference values only. Equipment and ratings vary by year, engine option and market; missing values are excluded rather than estimated.</div>
  </section>,mount);
}
