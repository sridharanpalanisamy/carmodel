"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const models = [
  ["Bronco","1966 reference","First-generation Bronco introduced as a compact four-wheel-drive utility vehicle, designed for off-road use."],
  ["Deluxe Coupe","1940 reference","A 1940 Ford Deluxe two-door coupe representing the pre-war American passenger-car design."],
  ["F-100","1953 reference","The first F-100 model year brought Ford's redesigned F-Series pickup into the new generation."],
  ["Falcon","1960 reference","The first-generation Falcon was Ford's compact, economical family car, introduced for the 1960 model year."],
  ["Ford V8","1932 reference","The 1932 Ford introduced the famous flathead V8 to a mass-market car at an accessible price."],
  ["GT40","1966 Mk I reference","A purpose-built mid-engine endurance racer developed to challenge the leading sports-car teams at Le Mans."],
  ["Model A","1928–1931 reference","Ford's Model A replaced the Model T with updated styling, improved controls and several body styles."],
  ["Model T","1908–1927 reference","The Model T helped make automobile ownership widely accessible through large-scale production."],
  ["Mustang","1965 reference","The first-generation Mustang launched the pony-car segment, combining compact dimensions with sporty styling."],
  ["Pinto","1971 reference","Ford's subcompact Pinto was introduced for 1971, targeting the growing small-car market."],
  ["Thunderbird","1955 reference","The first Thunderbird combined two-seat styling with V8 performance and personal-luxury positioning."]
];

export const fordNameplates = models.map(([name, years]) => ({ name, years }));

const imageByName = {
  "Bronco": "ford-bronco.png",
  "Deluxe Coupe": "ford_deluxe.png",
  "F-100": "ford-f100.png",
  "Falcon": "ford-falcon.png",
  "Ford V8": "ford-v8.png",
  "GT40": "ford-gt40.png",
  "Model A": "ford-model-a.png",
  "Model T": "ford-model-t.png",
  "Mustang": "ford-mustang.png",
  "Pinto": "ford-pinto.png",
  "Thunderbird": "ford-thunderbird.png"
};

export default function ModelDirectory() {
  const [mount, setMount] = useState(null);
  const [query, setQuery] = useState("");
  useEffect(() => { setMount(document.getElementById("azArchiveMount")); }, []);

  const filteredModels = useMemo(() => {
    const term = query.trim().toLowerCase();
    return models.filter(([name, years, description]) =>
      (name + " " + years + " " + description).toLowerCase().includes(term)
    );
  }, [query]);

  if (!mount) return null;
  return createPortal(
    <section className="az-archive az-photo-collection" id="az-archive">
      <div className="models-heading">
        <div><span className="eyebrow">THE 11 SELECTED FORD MODELS</span><h2>Explore the collection.</h2><p className="collection-subtitle">Every model is shown with its photograph, reference year and a short historical description.</p></div>
        <label className="search-wrap"><span>⌕</span><input type="search" placeholder="Search these 11 models..." aria-label="Search Ford models" value={query} onChange={event => setQuery(event.target.value)} /></label>
      </div>
      <p className="az-count" aria-live="polite">{filteredModels.length} of 11 models</p>
      <div className="az-grid az-photo-grid">
        {filteredModels.map(([name, years, description]) => (
          <article className="az-card az-photo-card" key={name}>
            <div className="az-photo-frame"><img src={"/carmodel/assets/images/" + imageByName[name]} alt={"Ford " + name + " (" + years + ")"} loading="lazy" /></div>
            <div className="az-card-copy"><h3>Ford {name}</h3><span className="az-years">{years}</span><p>{description}</p></div>
            <button type="button" className="az-view-button" onClick={() => {
              window.dispatchEvent(new CustomEvent("ford:compare-model", { detail: { name } }));
            }}>Compare</button>
          </article>
        ))}
      </div>
      <p className="az-note">Historical reference collection. Specifications can differ by engine option, trim, production date and market.</p>
    </section>,
    mount
  );
}
