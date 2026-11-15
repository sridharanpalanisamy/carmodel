"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fordNameplates } from "./AtoZDirectory";

const featured = [
  { name: "Mustang", year: "1964–present", note: "Pony-car icon" },
  { name: "Model T", year: "1908–1927", note: "Mass-mobility milestone" },
  { name: "GT40", year: "1964–1969", note: "Endurance racing legend" },
  { name: "Bronco", year: "1966–present", note: "Off-road heritage" },
  { name: "F-Series", year: "1948–present", note: "Pickup truck family" },
  { name: "Thunderbird", year: "1955–2005", note: "Personal luxury" }
];
const milestones = [
  { year: 1903, label: "Ford Motor Company founded" },
  { year: 1908, label: "Model T introduced" },
  { year: 1913, label: "Moving assembly-line development" },
  { year: 1917, label: "Ford truck production begins" },
  { year: 1927, label: "Model T production ends" },
  { year: 1932, label: "Ford V8 era begins" },
  { year: 1948, label: "F-Series introduced" },
  { year: 1964, label: "Mustang debuts" },
  { year: 1966, label: "GT40 wins Le Mans" },
  { year: 2020, label: "Mustang Mach-E enters production" }
];
const categoryFor = name => /bronco|escape|explorer|expedition|excursion|maverick/i.test(name) ? "SUV / off-road" : /f-series|f-100|ranger/i.test(name) ? "Pickup / utility" : /transit|econoline|e-series|windstar|freestar/i.test(name) ? "Van / commercial" : /gt40|^gt$|mustang|capri|probe|thunderbird/i.test(name) ? "Performance / sports" : "Passenger car";
const categories = ["Passenger car", "SUV / off-road", "Pickup / utility", "Van / commercial", "Performance / sports"];
const categoryColors = ["#24445a", "#477b82", "#d56b43", "#8b9b70", "#a48b73"];
const decadeFor = years => {
  const match = String(years).match(/(?:19|20)\d{2}/);
  return match ? Math.floor(Number(match[0]) / 10) * 10 : null;
};
const decadeLabels = ["1900s", "1910s", "1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];

export default function FordDashboardOverview() {
  const [search, setSearch] = useState("");
  const directoryStats = useMemo(() => {
    const counts = categories.map(category => ({ category, count: fordNameplates.filter(model => categoryFor(model.name) === category).length }));
    const decades = decadeLabels.map(label => {
      const decade = Number(label.slice(0, 4));
      return { label, count: fordNameplates.filter(model => decadeFor(model.years) === decade).length };
    });
    return { counts, decades };
  }, []);
  const filteredFeatured = featured.filter(model => (model.name + " " + model.note + " " + model.year).toLowerCase().includes(search.trim().toLowerCase()));
  const maxCategory = Math.max(...directoryStats.counts.map(item => item.count), 1);
  const maxDecade = Math.max(...directoryStats.decades.map(item => item.count), 1);

  return (
    <main className="page-shell ford-command-dashboard">
      <section className="ford-command-hero">
        <div className="ford-command-hero-copy">
          <span className="eyebrow">FORD / VEHICLE KNOWLEDGE CENTRE</span>
          <h1>Explore the story<br/><em>behind every Ford.</em></h1>
          <p>A central workspace for Ford models, vehicle specifications, engineering systems, manufacturing and heritage.</p>
          <div className="ford-command-actions">
            <Link href="/models/" className="ford-command-primary">Explore Ford models <span>↗</span></Link>
            <Link href="/heritage/" className="ford-command-secondary">Discover the heritage</Link>
          </div>
        </div>
      </section>

      <section className="ford-command-kpis" aria-label="Ford archive summary">
        <Link href="/models/" className="ford-command-kpi"><span>MODEL DIRECTORY</span><strong>{fordNameplates.length}</strong><small>Ford nameplates indexed ↗</small></Link>
        <Link href="/heritage/" className="ford-command-kpi"><span>HERITAGE TIMELINE</span><strong>{milestones.length}</strong><small>Key historical milestones ↗</small></Link>
        <Link href="/engineering/" className="ford-command-kpi"><span>ENGINEERING LIBRARY</span><strong>6</strong><small>Vehicle systems explored ↗</small></Link>
        <Link href="/specifications/" className="ford-command-kpi"><span>VERIFIED REFERENCE DATA</span><strong>11</strong><small>Historical spec references ↗</small></Link>
      </section>

      <section className="ford-command-section">
        <div className="ford-command-section-heading"><div><span className="eyebrow">COLLECTION OVERVIEW</span><h2>Ford at a <em>glance.</em></h2><p>Explore the distribution of nameplates currently listed in the A–Z directory.</p></div><Link href="/models/">View full directory ↗</Link></div>
        <div className="ford-command-analytics">
          <article className="ford-command-panel">
            <div className="ford-command-panel-head"><div><span>01 / CATEGORY BREAKDOWN</span><h3>Models by vehicle type</h3></div><small>{fordNameplates.length} nameplates</small></div>
            <div className="ford-command-bars">{directoryStats.counts.map((item,index) => <Link href={"/models/?category="+encodeURIComponent(item.category)} className="ford-command-bar-row ford-command-chart-link" key={item.category} aria-label={"View "+item.count+" nameplates in "+item.category}><div><span>{item.category} ↗</span><b>{item.count}</b></div><div className="ford-command-track"><i style={{width:(item.count/maxCategory*100)+"%",background:categoryColors[index]}}/></div></Link>)}</div>
            <p className="ford-command-chart-note">Categories follow the directory's current nameplate classification. Some models and regional nameplates may fit more than one vehicle segment.</p>
          </article>
          <article className="ford-command-panel">
            <div className="ford-command-panel-head"><div><span>02 / HISTORICAL SPREAD</span><h3>First listed model year</h3></div><small>By decade</small></div>
            <div className="ford-command-decade-chart" aria-label="Select a decade to explore the nearest heritage milestone">{directoryStats.decades.map(item=><Link href={"/heritage/?year="+item.label.slice(0,4)} className="ford-command-decade ford-command-decade-link" key={item.label} aria-label={"Explore heritage around "+item.label}><div className="ford-command-decade-bar"><i style={{height:(item.count/maxDecade*100)+"%"}}/></div><b>{item.count || ""}</b><span>{item.label.slice(0,2)}</span></Link>)}</div>
            <p className="ford-command-chart-note">Uses the first four-digit year shown in each directory entry; this is a directory overview, not a count of vehicles produced.</p>
          </article>
        </div>
      </section>

      <section className="ford-command-section ford-command-featured">
        <div className="ford-command-section-heading"><div><span className="eyebrow">CURATED MODEL SPOTLIGHT</span><h2>Explore iconic <em>nameplates.</em></h2><p>A quick route into a selection of Ford vehicles from different eras and segments.</p></div><label className="ford-command-search"><span>⌕</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Find a featured model" aria-label="Search featured models"/></label></div>
        <div className="ford-command-feature-grid">{filteredFeatured.map(model=><Link href="/models/" className="ford-command-feature-card" key={model.name}><div className="ford-command-feature-copy"><span>{model.year}</span><h3>Ford {model.name}</h3><p>{model.note}</p><b>Explore model <i>↗</i></b></div></Link>)}</div>
        {filteredFeatured.length===0 && <p className="ford-command-empty">No featured model matches that search. Try another name.</p>}
      </section>

      <section className="ford-command-section ford-command-history">
        <div className="ford-command-section-heading"><div><span className="eyebrow">1903 — 2020 / SELECTED MOMENTS</span><h2>A century of <em>progress.</em></h2><p>Selected chapters from the interactive Heritage timeline.</p></div><Link href="/heritage/">Explore full heritage timeline ↗</Link></div>
        <div className="ford-command-milestones">{milestones.map((item,index)=><Link href={"/heritage/?year="+item.year} className="ford-command-milestone" key={item.year}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.year}</strong><p>{item.label}</p></Link>)}</div>
      </section>

      <section className="ford-command-section">
        <div className="ford-command-section-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h2>Go straight to the <em>details.</em></h2><p>Each area has its own focused page, so the dashboard stays clear and easy to scan.</p></div></div>
        <div className="ford-command-workspaces">
          <Link href="/models/"><span>01 / DIRECTORY</span><strong>Ford models</strong><p>Browse vehicle images, nameplates, categories and histories.</p><b>Open model gallery ↗</b></Link>
          <Link href="/specifications/"><span>02 / DATA</span><strong>Comparison</strong><p>Compare available engine, power, torque and drivetrain references.</p><b>Open comparison ↗</b></Link>
          <Link href="/engineering/"><span>03 / TECHNICAL</span><strong>Engineering</strong><p>Understand vehicle systems, components, operation and inspection.</p><b>Explore engineering ↗</b></Link>
          <Link href="/factory/"><span>04 / PRODUCTION</span><strong>Factory process</strong><p>Follow manufacturing stages and production operations.</p><b>Open factory process ↗</b></Link>
          <Link href="/heritage/"><span>05 / HISTORY</span><strong>Heritage</strong><p>Explore the Ford chronology and integrated A–Z nameplate archive.</p><b>Explore heritage ↗</b></Link>
        </div>
      </section>
      <p className="ford-command-footnote">Dashboard figures reflect the current website directory and reference modules. Historical vehicle specifications vary by year, market and trim; unavailable values are not estimated.</p>
    </main>
  );
}
