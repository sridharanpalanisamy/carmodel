"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fordNameplates } from "./AtoZDirectory";
import { references } from "./VehicleSpecificationDashboard";

const featured = [
  { name: "Mustang", year: "1964–present", note: "Pony-car icon" },
  { name: "Model T", year: "1908–1927", note: "Mass-mobility milestone" },
  { name: "GT40", year: "1964–1969", note: "Endurance racing legend" },
  { name: "Bronco", year: "1966–present", note: "Off-road heritage" },
  { name: "F-100", year: "1953 reference", note: "F-Series pickup heritage" },
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
const categoryFor = name => /f-series|f-100|ranger|maverick/i.test(name) ? "Pickup / utility" : /bronco|escape|explorer|expedition|excursion|flex/i.test(name) ? "SUV / off-road" : /transit|econoline|e-series|windstar|freestar/i.test(name) ? "Van / commercial" : /gt40|^gt$|mustang|capri|probe|thunderbird/i.test(name) ? "Performance / sports" : "Passenger car";
const categories = ["Passenger car", "SUV / off-road", "Pickup / utility", "Van / commercial", "Performance / sports"];
const categoryColors = ["#3B82F6", "#14B8A6", "#F59E0B", "#8B5CF6", "#F97316"];
const decadeFor = years => {
  const match = String(years).match(/(?:19|20)\d{2}/);
  return match ? Math.floor(Number(match[0]) / 10) * 10 : null;
};
const decadeLabels = ["1900s", "1910s", "1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
const comparisonPairs = [
  { left: "Mustang", right: "GT40", label: "Pony car vs endurance racer" },
  { left: "Model T", right: "Model A", label: "Early mass-mobility generations" },
  { left: "Thunderbird", right: "Falcon", label: "Two very different 1960s-era roles" }
];


export default function FordDashboardOverview() {
  const [search, setSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const directoryStats = useMemo(() => {
    const counts = categories.map(category => ({ category, count: fordNameplates.filter(model => categoryFor(model.name) === category).length }));
    const decades = decadeLabels.map(label => {
      const decade = Number(label.slice(0, 4));
      return { label, count: fordNameplates.filter(model => decadeFor(model.years) === decade).length };
    });
    return { counts, decades };
  }, []);
  const filteredFeatured = featured.filter(model => (model.name + " " + model.note + " " + model.year).toLowerCase().includes(search.trim().toLowerCase()));
  const archiveMatches = archiveSearch.trim() ? fordNameplates.filter(model => model.name.toLowerCase().includes(archiveSearch.trim().toLowerCase())).slice(0, 5) : [];
  const leadingCategory = [...directoryStats.counts].sort((a, b) => b.count - a.count)[0];
  const leadingDecade = [...directoryStats.decades].sort((a, b) => b.count - a.count)[0];
  const maxDecade = Math.max(...directoryStats.decades.map(item => item.count), 1);
  const categoryTotal = directoryStats.counts.reduce((sum, item) => sum + item.count, 0);
  const categoryDonut = directoryStats.counts.reduce((parts, item, index) => {
    const start = parts.total;
    const end = start + (categoryTotal ? item.count / categoryTotal * 100 : 0);
    parts.stops.push(categoryColors[index] + " " + start + "% " + end + "%");
    parts.total = end;
    return parts;
  }, { total: 0, stops: [] });
  const categoryGradient = "conic-gradient(" + categoryDonut.stops.join(", ") + ")";

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

      <section className="ford-command-section ford-command-discovery">
        <div className="ford-command-section-heading"><div><span className="eyebrow">ARCHIVE DISCOVERY</span><h2>Find your <em>Ford.</em></h2><p>Search across every nameplate in the A–Z archive, not just the featured selection.</p></div></div>
        <div className="ford-command-discovery-search"><label htmlFor="ford-archive-search">Search the model archive</label><input id="ford-archive-search" value={archiveSearch} onChange={event=>setArchiveSearch(event.target.value)} placeholder="Try Mustang, Bronco, F-Series..." autoComplete="off"/>{archiveSearch.trim() && <button type="button" onClick={()=>setArchiveSearch("")}>Clear</button>}</div>
        {archiveSearch.trim() && <div className="ford-command-search-results" aria-live="polite">{archiveMatches.length ? archiveMatches.map(model=><Link href={"/models/?search="+encodeURIComponent(model.name)} key={model.name}><span>{model.name}</span><b>View model ↗</b></Link>) : <p>No matching nameplate found. Try a shorter search.</p>}</div>}
        <div className="ford-command-insight-grid">
          <Link href={"/models/?category="+encodeURIComponent(leadingCategory.category)} className="ford-command-insight"><span>LEADING DIRECTORY CATEGORY</span><strong>{leadingCategory.category}</strong><small>{leadingCategory.count} listed nameplates ↗</small></Link>
          <Link href={"/heritage/?year="+leadingDecade.label.slice(0,4)} className="ford-command-insight"><span>BUSIEST NAMEPLATE DECADE</span><strong>{leadingDecade.label}</strong><small>{leadingDecade.count} first-listed entries ↗</small></Link>
          <Link href="/heritage/" className="ford-command-insight"><span>HERITAGE COVERAGE</span><strong>1903–2020</strong><small>Explore selected milestones ↗</small></Link>
        </div>
      </section>

      <section className="ford-command-section">
        <div className="ford-command-section-heading"><div><span className="eyebrow">COLLECTION OVERVIEW</span><h2>Ford at a <em>glance.</em></h2><p>Explore the distribution of nameplates currently listed in the A–Z directory.</p></div><Link href="/models/">View full directory ↗</Link></div>
        <div className="ford-command-analytics">
          <article className="ford-command-panel">
            <div className="ford-command-panel-head"><div><span>01 / CATEGORY BREAKDOWN</span><h3>Models by vehicle type</h3></div><small>{fordNameplates.length} nameplates</small></div>
            <div className="ford-command-category-chart"><div className="ford-command-donut" role="img" aria-label="Doughnut chart showing the share of nameplates by vehicle category" style={{background:categoryGradient}}><div><strong>{categoryTotal}</strong><span>nameplates</span></div></div><div className="ford-command-legend">{directoryStats.counts.map((item,index) => <Link href={"/models/?category="+encodeURIComponent(item.category)} className="ford-command-legend-row" key={item.category} aria-label={item.category+": "+item.count+" nameplates, "+(categoryTotal ? Math.round(item.count/categoryTotal*100) : 0)+" percent"} title={item.category+" — "+item.count+" nameplates"}><i style={{background:categoryColors[index]}}/><span>{item.category}</span><b>{item.count}</b><small>{categoryTotal ? Math.round(item.count/categoryTotal*100) : 0}%</small></Link>)}</div></div>
            <p className="ford-command-chart-note">Categories follow the directory's current nameplate classification. Some models and regional nameplates may fit more than one vehicle segment.</p>
          </article>
          <article className="ford-command-panel">
            <div className="ford-command-panel-head"><div><span>02 / HISTORICAL SPREAD</span><h3>First listed model year</h3></div><small>By decade</small></div>
            <div className="ford-command-decade-chart" aria-label="Nameplate counts by decade. Select a bar to explore the nearest heritage milestone.">{directoryStats.decades.map(item=><Link href={"/heritage/?year="+item.label.slice(0,4)} className="ford-command-decade ford-command-decade-link" key={item.label} aria-label={item.label+": "+item.count+" nameplates. Open the heritage timeline around this decade."} title={item.label+" — "+item.count+" nameplates"}><div className="ford-command-decade-bar"><i style={{height:(item.count/maxDecade*100)+"%"}}/></div><b>{item.count}</b><span>{item.label}</span></Link>)}</div>
            <p className="ford-command-chart-note">Uses the first four-digit year shown in each directory entry; this is a directory overview, not a count of vehicles produced.</p>
          </article>
        </div>
      </section>

      <section className="ford-command-section ford-command-comparison-snapshot">
        <div className="ford-command-section-heading"><div><span className="eyebrow">REFERENCE DATA / QUICK LOOK</span><h2>Compare two <em>Ford icons.</em></h2><p>Small snapshots from the site's year-labelled specification references.</p></div><Link href="/specifications/">Open full comparison ↗</Link></div>
        <div className="ford-command-compare-grid">{comparisonPairs.map(pair=>{const a=references.find(item=>item.name===pair.left);const b=references.find(item=>item.name===pair.right);return <article className="ford-command-compare-card" key={pair.left+"-"+pair.right}><span>{pair.label}</span><div className="ford-command-compare-names"><strong>{a.name}</strong><i>VS</i><strong>{b.name}</strong></div><div className="ford-command-compare-metrics"><div><small>ENGINE</small><b>{a.capacity.toFixed(1)} L <em>/</em> {b.capacity.toFixed(1)} L</b></div><div><small>POWER</small><b>{a.power} hp <em>/</em> {b.power} hp</b></div><div><small>REFERENCE</small><b>{a.year} <em>/</em> {b.year}</b></div></div><Link href="/specifications/">Compare specifications ↗</Link></article>;})}</div>
        <p className="ford-command-chart-note">Figures are representative configurations from the specification library, not universal model-wide values. Open the comparison page for drivetrain, transmission, torque and notes.</p>
      </section>

      <section className="ford-command-section ford-command-research-paths">
        <div className="ford-command-section-heading"><div><span className="eyebrow">START WITH A THEME</span><h2>Choose a research <em>path.</em></h2><p>Jump into a focused part of Ford history, vehicle design and model development.</p></div></div>
        <div className="ford-command-path-grid">
          <Link href="/models/?search=Capri" className="ford-command-path-card"><span>01 / ELECTRIFICATION</span><strong>Electric-era models</strong><p>Explore the revived Capri and Ford's changing approach to electrified vehicles.</p><b>Explore Capri ↗</b></Link>
          <Link href="/models/?search=GT40" className="ford-command-path-card"><span>02 / MOTORSPORT</span><strong>Performance heritage</strong><p>Start with the GT40 and trace Ford's competition-focused engineering story.</p><b>Explore GT40 ↗</b></Link>
          <Link href="/models/?search=F-Series" className="ford-command-path-card"><span>03 / WORK & UTILITY</span><strong>Pickup generations</strong><p>Browse the F-Series and its long-running role in work and transport.</p><b>Explore F-Series ↗</b></Link>
          <Link href="/models/?search=Bronco" className="ford-command-path-card"><span>04 / OFF-ROAD</span><strong>Adventure vehicles</strong><p>Discover the Bronco nameplate and its dedicated off-road identity.</p><b>Explore Bronco ↗</b></Link>
        </div>
      </section>

      <section className="ford-command-section ford-command-featured">
        <div className="ford-command-section-heading"><div><span className="eyebrow">CURATED MODEL SPOTLIGHT</span><h2>Explore iconic <em>nameplates.</em></h2><p>A quick route into a selection of Ford vehicles from different eras and segments.</p></div><label className="ford-command-search"><span>⌕</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Find a featured model" aria-label="Search featured models"/></label></div>
        <div className="ford-command-feature-grid">{filteredFeatured.map(model=><Link href={"/models/?search="+encodeURIComponent(model.name)} className="ford-command-feature-card" key={model.name}><div className="ford-command-feature-copy"><span>{model.year}</span><h3>Ford {model.name}</h3><p>{model.note}</p><b>Explore model <i>↗</i></b></div></Link>)}</div>
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
