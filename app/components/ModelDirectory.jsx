"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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

const letters = ["all", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export default function ModelDirectory() {
  const [mount, setMount] = useState(null);
  const [query, setQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("all");

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
          <span className="eyebrow">THE COMPLETE NAMEPLATE INDEX</span>
          <h2>Ford models, A to Z.</h2>
          <p className="collection-subtitle">Browse a wider alphabetical directory of Ford passenger cars, performance cars, SUVs, pickups and vans. Not every nameplate was sold in every country.</p>
        </div>
        <label className="search-wrap">
          <span>⌕</span>
          <input id="azSearch" type="search" placeholder="Search the A–Z directory..." aria-label="Search A to Z Ford models" value={query} onChange={event => setQuery(event.target.value)} />
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
          <article className="az-card" key={name}>
            <span className="az-initial">{name[0].toUpperCase()}</span>
            <div>
              <h3>Ford {name}</h3>
              <span className="az-years">{years}</span>
              <p>{description}</p>
            </div>
            <button type="button" className="az-view-button" data-local3d={name}>View 3D ↗</button>
          </article>
        ))}
      </div>
      <p className="az-note">Historical nameplates and model families are included across different markets and generations. Engine capacity, fuel type, performance and equipment vary by model year, trim and country; use the individual vehicle's specification sheet for verified year-specific details. This is an enthusiast reference directory, not a claim that every model was available in every market.</p>
    </section>,
    mount
  );
}
