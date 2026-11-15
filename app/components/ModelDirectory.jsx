"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FordGLBViewer from "./FordGLBViewer";

const models = [
  ["Bronco","1966 reference","First-generation off-road SUV; launch-year six-cylinder reference."],
  ["Deluxe Coupe","1940 reference","Representative 1940 Ford Deluxe 85-series coupe."],
  ["F-100","1953 reference","First model year of the F-100 pickup."],
  ["Falcon","1960 reference","First-generation compact Ford Falcon reference."],
  ["Ford V8","1932 reference","Early flathead V8 passenger-car reference."],
  ["GT40","1966 Mk I reference","Mid-engine endurance racing car developed for international competition."],
  ["Model A","1928–1931 reference","Successor to the Model T, offered in numerous body styles."],
  ["Model T","1908–1927 reference","Mass-produced early automobile that transformed personal mobility."],
  ["Mustang","1965 reference","First-generation Mustang; 289 Hi-Po V8 reference configuration."],
  ["Pinto","1971 reference","Subcompact car introduced for the 1971 model year."],
  ["Thunderbird","1955 reference","First-generation personal-luxury and grand-touring car."]
];

export const fordNameplates = models.map(([name, years]) => ({ name, years }));

const imageByName = {\n  "Deluxe Coupe": "ford-deluxe-coupe.png", "Ford V8": "ford-v8.png", "F-100": "ford-f100.png",
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
  "Ford V8": ["3.6 L flathead V8 (1932 reference)", "Petrol", "3-speed manual", "Rear-wheel drive"],
  "Deluxe Coupe": ["3.6 L flathead V8 (1940 reference)", "Petrol", "3-speed manual", "Rear-wheel drive"]
};
const categoryFor = name => /bronco|escape|explorer|expedition|excursion|maverick/i.test(name) ? "SUV / off-road" : /f-series|f-100|ranger/i.test(name) ? "Pickup / utility" : /transit|econoline|e-series|windstar|freestar/i.test(name) ? "Van / commercial" : /gt40|^gt$|mustang|capri|probe|thunderbird/i.test(name) ? "Performance / sports" : "Passenger car";
const letters = ["all", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export default function ModelDirectory() {
  const [mount, setMount] = useState(null);
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("all");
  const [selectedModel, setSelectedModel] = useState(null);
  const [show3D, setShow3D] = useState(false);
  const inlineViewerRef = useRef(null);

  useEffect(() => {
    if (!selectedModel || selectedModel.name === "Model T" || !show3D || !inlineViewerRef.current || !window.FordLocal3D) return;
    const viewer = window.FordLocal3D.mount(inlineViewerRef.current, selectedModel.name);
    return () => viewer?.destroy();
  }, [selectedModel, show3D]);

  useEffect(() => {
    setMount(document.getElementById("azArchiveMount"));
  }, []);

  const filteredModels = useMemo(() => {
    const term = query.trim().toLowerCase();
    return models.filter(([name, years, description]) =>
      (activeLetter === "all" || name[0].toUpperCase() === activeLetter) &&
      (name + " " + years + " " + description).toLowerCase().includes(term)
    ).sort((a, b) => a[0].localeCompare(b[0]));
  }, [query, activeLetter]);

  if (!mount) return null;

  return createPortal(
    <section className="az-archive" id="az-archive">
      <div className="models-heading">
        <div>
          <span className="eyebrow">11 SELECTED HISTORIC MODELS</span>
          <h2>11 Ford models.</h2>
          <p className="collection-subtitle">Browse these 11 selected historic Ford models. Select a model to view its details and available local 3D view.</p>
        </div>
        <label className="search-wrap">
          <span>⌕</span>
          <input id="azSearch" type="search" placeholder="Search the 11 Ford models..." aria-label="Search A to Z Ford models" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
      </div>
      <div className="az-letters" id="azLetters" aria-label="Filter by first letter">
        {letters.map(letter => (
          <button key={letter} type="button" className={activeLetter === letter ? "active" : ""} data-letter={letter} aria-pressed={activeLetter === letter} onClick={() => setActiveLetter(letter)}>
            {letter === "all" ? "All" : letter}
          </button>
        ))}
      </div>
      <p className="az-count" id="azCount" aria-live="polite">{filteredModels.length} Ford nameplate{filteredModels.length === 1 ? "" : "s"} shown</p>
      <div className="az-grid" id="azGrid">
        {filteredModels.map(([name, years, description]) => (
          <article
            className="az-card"
            key={name}
            role="button"
            tabIndex={0}
            aria-label={"View Ford " + name + " picture and specifications"}
            onClick={event => { if (!event.target.closest("[data-local3d]")) setShow3D(false); setSelectedModel({ name, years, description }); }}
            onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); setSelectedModel({ name, years, description }); } }}
          >
            <span className="az-initial">{name[0].toUpperCase()}</span>
            <div className="az-card-copy">
              <h3>Ford {name}</h3>
              <span className="az-years">{years}</span>
              <p>{description}</p>
            </div>
            <button type="button" className="az-view-button" aria-label={"View " + name + " picture and specifications"} onClick={event => { event.stopPropagation(); setSelectedModel({ name, years, description }); }}>View</button>
          </article>
        ))}
      </div>
      {selectedModel && (
        <div className="az-detail-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedModel(null); }}>
          <section className="az-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="azDetailTitle">
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
      <p className="az-note">This focused collection contains the same 11 historic reference models used in the specification dashboard. Specifications are representative of the stated reference year and may vary by trim and market.</p>
    </section>,
    mount
  );
}
