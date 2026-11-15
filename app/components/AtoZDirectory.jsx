"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FordGLBViewer from "./FordGLBViewer";

const models = [
  ["Anglia","1939–1967","Small family car sold in several generations."],
  ["Aspire","1994–1997","Subcompact car sold in North America."],
  ["B-Max","2012–2017","Small multi-purpose vehicle for the European market."],
  ["Bronco","1966–present","Off-road SUV nameplate; generation and market specifications vary."],
  ["C-Max","2003–2019","Compact multi-purpose vehicle family."],
  ["Capri","1969–1986; 2024–present","Sporty coupe nameplate revived as an electric crossover in Europe."],
  ["Consul","1951–1975","British-market family and executive car range."],
  ["Contour","1995–2000","North American compact sedan related to the European Mondeo."],
  ["Cortina","1962–1982","Popular British family car."],
  ["Crown Victoria","1992–2012","Full-size body-on-frame sedan."],
  ["Custom","1949–1981 (various series)","Ford Custom was used on several full-size car lines and trim ranges."],
  ["Econoline / E-Series","1961–present (E-Series)","Full-size van and cutaway commercial vehicle family."],
  ["Escort","1968–2003 (Europe); 1981–2003 (North America)","Compact car nameplate with distinct regional generations."],
  ["Escape","2000–present","Compact crossover SUV; hybrid and plug-in hybrid versions in selected markets."],
  ["Excursion","2000–2005","Heavy-duty full-size SUV."],
  ["Expedition","1997–present","Full-size three-row SUV."],
  ["Explorer","1990–present","Mid-size SUV nameplate."],
  ["F-Series","1948–present","Ford's full-size pickup family, including F-150 and Super Duty."],
  ["Fairlane","1955–1970; Australia through 2007","Full-size and later mid-size car nameplate; regional histories differ."],
  ["Falcon","1960–2016 (market dependent)","Compact US car that became a long-running Australian large-car family."],
  ["Fiesta","1976–2023","Global supermini / subcompact hatchback."],
  ["Five Hundred","2004–2007","North American full-size sedan."],
  ["Flex","2009–2019","Three-row crossover with distinctive boxy styling."],
  ["Focus","1998–present (global production varies)","Compact car offered as hatchback, sedan and wagon."],
  ["Freestar","2004–2007","North American minivan."],
  ["Fusion","2002–2012 (Europe); 2006–2020 (North America)","Name used for different vehicles in different regions."],
  ["Galaxie / Galaxie 500","1959–1974","Full-size American car range."],
  ["Granada","1972–1982 (North America); 1972–1994 (Europe)","Mid-size / executive car nameplate with regional differences."],
  ["GT","2004–2006; 2016–2022","Mid-engine Ford supercar in two modern generations."],
  ["GT40","1964–1969","Mid-engine endurance racing car developed for international competition."],
  ["Ka","1996–2021","Small city car sold mainly in Europe and Latin America."],
  ["LTD","1965–1986 (North America)","Full-size Ford car range."],
  ["Maverick","1970–1977; 2021–present","Name used first for a compact car and later for a compact pickup."],
  ["Model A","1927–1931","Successor to the Model T, offered in numerous body styles."],
  ["Model T","1908–1927","Mass-produced early automobile that transformed personal mobility."],
  ["Mondeo","1993–2022 (Europe)","Global mid-size family car; related to some generations of the North American Fusion."],
  ["Mustang","1964–present","Long-running American pony car and performance-car family."],
  ["Pinto","1971–1980","Subcompact car sold in North America."],
  ["Probe","1988–1997","Front-wheel-drive sporty coupe."],
  ["Ranger","1983–present (global production varies)","Mid-size pickup nameplate with different regional generations."],
  ["S-Max","2006–2023","Sporty seven-seat multi-purpose vehicle sold in Europe."],
  ["Scorpio","1985–1998","European executive car."],
  ["Sierra","1982–1993","European mid-size family car."],
  ["Taurus","1986–2019 (North America); later regional versions","Mid-size / full-size sedan nameplate with multiple generations."],
  ["Tempo","1984–1994","Compact front-wheel-drive sedan and coupe."],
  ["Thunderbird","1955–2005","Personal luxury and grand-touring car across eleven generations."],
  ["Transit","1965–present","Global light commercial van and passenger-van family."],
  ["Windstar","1995–2003","North American minivan, later replaced by the Freestar."]
];


export const fordNameplates = models.map(([name, years, description]) => ({ name, years, description }));

const imageByName = {
  "Bronco": "ford-bronco.png", "Falcon": "ford-falcon.png", "GT40": "Ford_GT-40.jpg",
  "Model A": "ford-model-a.png", "Model T": "ford_model_t.png", "Mustang": "ford-mustang.png",
  "Pinto": "ford-pinto.png", "Thunderbird": "ford-thunderbird.png",
  "F-Series": "ford-f100.png", "F-100": "ford-f100.png"
};
const featuredSpecs = {
  "Model T": ["2.9 L inline-4", "Petrol", "2-speed planetary", "Rear-wheel drive"],
  "Model A": ["3.3 L inline-4", "Petrol", "3-speed manual", "Rear-wheel drive"],
  "GT40": ["4.7 L V8 (Mk I reference)", "Petrol", "5-speed manual transaxle", "Mid-engine, rear-wheel drive"],
  "Mustang": ["3.3 L inline-6 or 4.7 L V8 (1965 reference)", "Petrol", "Manual or automatic, depending on engine", "Rear-wheel drive"],
  "Pinto": ["1.6 L or 2.0 L inline-4 (1971 reference)", "Petrol", "Manual or automatic, depending on trim", "Rear-wheel drive"],
  "Bronco": ["2.8 L inline-6 or 4.7 L V8 (1966 reference)", "Petrol", "3-speed manual", "Four-wheel drive"],
  "Falcon": ["2.4 L or 2.8 L inline-6 (1960 reference)", "Petrol", "Manual or automatic, depending on trim", "Rear-wheel drive"],
  "Thunderbird": ["4.8 L Y-block V8 (1955 reference)", "Petrol", "Manual or Ford-O-Matic automatic", "Rear-wheel drive"],
  "F-Series": ["Engine varies by F-Series generation and model", "Petrol or diesel, depending on year and market", "Manual or automatic", "Rear-wheel or four-wheel drive"],
  "F-100": ["3.5 L inline-6 or 3.9 L V8 (1953 reference)", "Petrol", "Manual; options varied", "Rear-wheel drive"],
  "V8": ["3.6 L flathead V8 (1932 reference)", "Petrol", "3-speed manual", "Rear-wheel drive"],
  "Deluxe Coupe": ["3.6 L flathead V8 (1940 reference)", "Petrol", "3-speed manual", "Rear-wheel drive"]
};
const categoryFor = name => /f-series|f-100|ranger|maverick/i.test(name) ? "Pickup / utility" : /bronco|escape|explorer|expedition|excursion|flex/i.test(name) ? "SUV / off-road" : /transit|econoline|e-series|windstar|freestar/i.test(name) ? "Van / commercial" : /gt40|^gt$|mustang|capri|probe|thunderbird/i.test(name) ? "Performance / sports" : "Passenger car";
const letters = ["all", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export default function ModelDirectory() {
  const [mount, setMount] = useState(null);
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("all");
  const [selectedModel, setSelectedModel] = useState(null);
  const [show3D, setShow3D] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inlineViewerRef = useRef(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (!selectedModel || selectedModel.name === "Model T" || !show3D || !inlineViewerRef.current || !window.FordLocal3D) return;
    const viewer = window.FordLocal3D.mount(inlineViewerRef.current, selectedModel.name);
    return () => viewer?.destroy();
  }, [selectedModel, show3D]);

  useEffect(() => {
    setMount(document.getElementById("azArchiveMount"));
  }, []);

  useEffect(() => {
    if (!selectedModel) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = event => {
      if (event.key === "Escape") setSelectedModel(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [selectedModel]);

  function openModel(model) {
    openerRef.current = document.activeElement;
    setShow3D(false);
    setSelectedModel(model);
  }

  const filteredModels = useMemo(() => {
    const term = query.trim().toLowerCase();
    return models.filter(([name, years, description]) =>
      (activeLetter === "all" || name[0].toUpperCase() === activeLetter) &&
      (name + " " + years + " " + description).toLowerCase().includes(term)
    ).sort((a, b) => a[0].localeCompare(b[0]));
  }, [query, activeLetter]);

  const featuredNames = ["Mustang", "Model T", "GT40", "Bronco", "F-Series", "Thunderbird"];
  const hasActiveFilter = query.trim().length > 0 || activeLetter !== "all";
  const displayedModels = hasActiveFilter || showAll ? filteredModels : featuredNames.map(name => models.find(model => model[0] === name)).filter(Boolean);

  if (!mount) return null;

  return createPortal(
    <section className="az-archive" id="az-archive">
      <div className="models-heading">
        <div>
          <span className="eyebrow">EXPLORE THE FORD ARCHIVE</span>
          <h2>Find a Ford model.</h2>
          <p className="collection-subtitle">Start with six highlights or search the complete nameplate archive.</p>
        </div>
        <label className="search-wrap">
          <span>⌕</span>
          <input id="azSearch" type="search" placeholder="Search the A–Z directory..." aria-label="Search A to Z Ford models" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
      </div>
      {(showAll || hasActiveFilter) && <div className="az-letters" id="azLetters" aria-label="Filter by first letter">
        {letters.map(letter => (
          <button key={letter} type="button" className={activeLetter === letter ? "active" : ""} data-letter={letter} aria-pressed={activeLetter === letter} onClick={() => setActiveLetter(letter)}>
            {letter === "all" ? "All" : letter}
          </button>
        ))}
      </div>}
      <p className="az-count" id="azCount" aria-live="polite">{hasActiveFilter || showAll ? filteredModels.length + " Ford nameplate" + (filteredModels.length === 1 ? "" : "s") + " found" : "Featured Ford nameplates"}</p>
      <div className="az-grid" id="azGrid">
        {displayedModels.map(([name, years, description]) => (
          <article
            className="az-card"
            key={name}
            role="button"
            tabIndex={0}
            aria-label={"View Ford " + name + " picture and specifications"}
            onClick={() => openModel({ name, years, description })}
            onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); openModel({ name, years, description }); } }}
          >
            <span className="az-initial">{name[0].toUpperCase()}</span>
            <div className="az-card-copy">
              <h3>Ford {name}</h3>
              <span className="az-years">{years}</span>
              <p>{description}</p>
            </div>
            <button type="button" className="az-view-button" aria-label={"View " + name + " picture and specifications"} onClick={event => { event.stopPropagation(); openModel({ name, years, description }); }}>View</button>
          </article>
        ))}
      </div>
      {!hasActiveFilter && <button type="button" className="az-expand-button" onClick={() => setShowAll(value => !value)}>{showAll ? "Show featured models" : "Browse all " + models.length + " Ford nameplates"} <span>{showAll ? "−" : "+"}</span></button>}
      {selectedModel && (
        <div className="az-detail-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedModel(null); }}>
          <section ref={dialogRef} className="az-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="azDetailTitle" tabIndex={-1}>
            <button className="az-detail-close" type="button" aria-label="Close model details" onClick={() => setSelectedModel(null)}>×</button>
            <div className="az-detail-media">
              {imageByName[selectedModel.name] ? (
                <img src={"/carmodel/assets/images/" + imageByName[selectedModel.name]} alt={"Ford " + selectedModel.name} />
              ) : (
                <div className="az-image-pending">
                  <span>FORD MODEL ARCHIVE</span>
                  <strong>{selectedModel.name}</strong>
                  <p>No verified local photograph is available for this nameplate yet. Use the local 3D concept viewer for an illustrative view.</p>
                </div>
              )}
            </div>
            <div className="az-detail-content">
              <span className="eyebrow">FORD MODEL DETAILS</span>
              <h2 id="azDetailTitle">Ford {selectedModel.name}</h2>
              <p className="az-detail-description">{selectedModel.description}</p>
              <div className="az-detail-specs">
                <div><span>Production period</span><strong>{selectedModel.years}</strong></div>
                <div><span>Vehicle category</span><strong>{categoryFor(selectedModel.name)}</strong></div>
                <div><span>Engine / capacity</span><strong>{featuredSpecs[selectedModel.name]?.[0] || "Varies by generation, trim and market"}</strong></div>
                <div><span>Fuel type</span><strong>{featuredSpecs[selectedModel.name]?.[1] || "Varies by year and market"}</strong></div>
                <div><span>Transmission</span><strong>{featuredSpecs[selectedModel.name]?.[2] || "Manual / automatic options vary by generation"}</strong></div>
                <div><span>Drive type</span><strong>{featuredSpecs[selectedModel.name]?.[3] || "Varies by model, generation and configuration"}</strong></div>
              </div>
              <p className="az-detail-note">Specifications are representative where a reference configuration is available. For other nameplates, exact engine capacity, fuel, transmission and drivetrain depend on model year, generation, trim and country.</p>
              <div className="az-detail-actions">
                <button type="button" className="model-3d-button" aria-expanded={show3D} onClick={() => setShow3D(value => !value)}>
                  {show3D ? "Hide 3D View" : "3D View"}
                </button>
              </div>
              {show3D && (
                <div className="az-inline3d-wrap">
                  <div className="az-inline3d-heading"><strong>Interactive 3D view · Ford {selectedModel.name}</strong><span>Drag to rotate · scroll to zoom</span></div>
                  {selectedModel.name === "Model T" ? (
                    <FordGLBViewer />
                  ) : (
                    <>
                      <canvas ref={inlineViewerRef} className="az-inline3d-canvas" aria-label={"Interactive illustrative 3D view of Ford " + selectedModel.name} />
                      <p className="az-inline3d-caption">Locally rendered illustrative concept — not a factory-accurate scan.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {(showAll || hasActiveFilter) && <p className="az-note">Historical nameplates span different markets and generations. Specifications vary by model year, trim and country.</p>}
    </section>,
    mount
  );
}
