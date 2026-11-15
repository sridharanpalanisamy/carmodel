"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const models = [
  { name:"Bronco", years:"1966 reference", period:"1966–1977 · First generation", type:"4×4 utility", image:"ford-bronco.png", description:"Ford's compact four-wheel-drive utility vehicle opened a new chapter in off-road motoring.", detail:"Introduced for 1966, the first Bronco was engineered around a short wheelbase, simple mechanical layout and genuine four-wheel-drive capability.", highlights:["Compact 4×4 platform","Designed for trail use","Multiple body styles"] },
  { name:"Deluxe Coupe", years:"1940 reference", period:"1940 · Pre-war era", type:"Classic coupe", image:"ford_deluxe.png", description:"A distinctive pre-war Ford coupe with streamlined styling and the character of the flathead era.", detail:"The 1940 Deluxe range brought refined body detailing and a broad choice of passenger-car styles. The coupe represents Ford's late-1930s and early-1940s design language.", highlights:["1940 model-year design","Flathead-era engineering","Two-door coupe body"] },
  { name:"F-100", years:"1953 reference", period:"1953–1956 · Second generation", type:"Pickup truck", image:"ford-f100.png", description:"The 1953 F-100 marked a new generation of Ford's F-Series with a more modern cab and chassis.", detail:"For the 1953 model year, Ford renamed its half-ton F-1 as the F-100. The redesigned truck formed an important step in the evolution of the F-Series.", highlights:["New F-100 designation","Updated cab design","Part of the F-Series legacy"] },
  { name:"Falcon", years:"1960 reference", period:"1960–1970 · First generation", type:"Compact car", image:"ford-falcon.png", description:"A practical, economical compact that helped Ford answer changing family-car needs.", detail:"Launched for 1960, the Falcon focused on straightforward packaging, accessible ownership and efficient use of space. Its platform also influenced later Ford models.", highlights:["Compact family-car layout","Economy-focused design","Important Mustang connection"] },
  { name:"Ford V8", years:"1932 reference", period:"1932 · Flathead V8 debut", type:"Classic sedan", image:"ford-v8.png", description:"The 1932 Ford made V8 power available in an affordable mass-market automobile.", detail:"Ford's 1932 range introduced the famous flathead V8. Its combination of accessible pricing and eight-cylinder performance made it a landmark in American automotive history.", highlights:["221 cu in flathead V8 launch","Mass-market V8 milestone","Iconic 1932 styling"] },
  { name:"GT40", years:"1966 Mk I reference", period:"1964–1969 · Racing programme", type:"Endurance racer", image:"ford-gt40.png", description:"A purpose-built mid-engine racer remembered for its success at the 24 Hours of Le Mans.", detail:"Developed for international endurance racing, the GT40 used a low-slung mid-engine layout. The Mk II and Mk I cars helped Ford secure four consecutive Le Mans overall wins from 1966 to 1969.", highlights:["Mid-engine layout","Le Mans winner in 1966","Endurance-racing icon"] },
  { name:"Model A", years:"1928–1931 reference", period:"1928–1931 · Model T successor", type:"Vintage car", image:"ford-model-a.png", description:"A new generation of Ford design with improved controls, comfort and body-style choice.", detail:"The Model A replaced the Model T at the end of 1927. It offered updated styling, a conventional three-speed transmission and a wide range of body styles.", highlights:["Replaced the Model T","Three-speed manual","Multiple factory body styles"] },
  { name:"Model T", years:"1908–1927 reference", period:"1908–1927 · Model T era", type:"Vintage car", image:"ford-model-t.png", description:"The car that helped make automobile ownership accessible to a much wider public.", detail:"The Model T became closely associated with moving assembly-line production and large-scale manufacturing. Its durability, simplicity and affordability reshaped personal transportation.", highlights:["Introduced in 1908","Moving-line production era","More than 15 million built"] },
  { name:"Mustang", years:"1965 reference", period:"1964½–1966 · First generation", type:"Pony car", image:"ford-mustang.png", description:"A sporty, personal car whose launch created a lasting new chapter in American performance.", detail:"Introduced in April 1964, the Mustang combined compact proportions, long-hood styling and a wide range of options. It established the pony-car formula.", highlights:["Introduced in April 1964","Wide engine and trim choices","Pony-car segment pioneer"] },
  { name:"Pinto", years:"1971 reference", period:"1971–1980 · Subcompact era", type:"Subcompact car", image:"ford-pinto.png", description:"Ford's small car for the 1970s, developed for buyers seeking compact dimensions and value.", detail:"The Pinto entered the US market for 1971 as a rear-wheel-drive subcompact. It reflected the growing demand for smaller, more economical cars.", highlights:["Introduced for 1971","Rear-wheel-drive layout","Subcompact market focus"] },
  { name:"Thunderbird", years:"1955 reference", period:"1955–1957 · First generation", type:"Personal luxury", image:"ford-thunderbird.png", description:"A two-seat V8-powered personal car that helped define the American personal-luxury idea.", detail:"The original Thunderbird arrived for 1955 with two seats, V8 power and a focus on style and comfort. It offered a different character from the more hard-edged sports cars of its era.", highlights:["Two-seat launch configuration","V8-powered grand touring","Personal-luxury heritage"] }
];

const categoryFor = name => ["Bronco"].includes(name) ? "SUVs & 4×4" : ["F-100"].includes(name) ? "Trucks & Pickups" : ["GT40"].includes(name) ? "Motorsport" : "Cars";
const categorizedModels = models.map(model => ({...model, category: categoryFor(model.name)}));
export const fordNameplates = models.map(({name,years}) => ({name,years}));

export default function ModelDirectory() {
  const [mount,setMount] = useState(null);
  const [query,setQuery] = useState("");
  const [selected,setSelected] = useState("");
  const [category,setCategory] = useState("All vehicles");
  useEffect(() => { setMount(document.getElementById("azArchiveMount")); }, []);
  const filteredModels = useMemo(() => {
    const term=query.trim().toLowerCase();
    return categorizedModels.filter(model => (category === "All vehicles" || model.category === category) && (model.name+" "+model.years+" "+model.period+" "+model.type+" "+model.description).toLowerCase().includes(term));
  },[query,category]);
  if(!mount) return null;
  return createPortal(
    <section className="az-archive az-photo-collection" id="az-archive">
      <div className="models-heading models-heading-upgraded">
        <div><span className="eyebrow">FORD VEHICLE COLLECTION</span><h2>Explore the <em>lineup.</em></h2><p className="collection-subtitle">A visual showcase of Ford vehicles organized by category. Engineering specifications and detailed comparisons are kept on a separate page.</p></div>
        <label className="search-wrap"><span>⌕</span><input type="search" placeholder="Search Ford vehicles..." aria-label="Search Ford models" value={query} onChange={event=>setQuery(event.target.value)}/></label>
      </div>
      <div className="model-category-filter" role="group" aria-label="Filter vehicle category">{["All vehicles","Cars","SUVs & 4×4","Trucks & Pickups","Motorsport"].map(item=><button type="button" key={item} className={category===item?"is-active":""} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div><div className="model-collection-summary"><span><b>{filteredModels.length.toString().padStart(2,"0")}</b> VEHICLES SHOWN</span><span>VISUAL COLLECTION <i>·</i> MODEL HISTORY</span></div>
      <div className="az-grid az-photo-grid az-photo-grid-upgraded">
        {filteredModels.map((model,index)=>(
          <article className={"az-card az-photo-card az-photo-card-upgraded "+(selected===model.name?"is-selected":"")} key={model.name}>
            <div className="az-photo-frame"><img src={"/carmodel/assets/images/"+model.image} alt={"Ford "+model.name+" — "+model.years} loading={index<3?"eager":"lazy"}/><span className="az-photo-number">0{models.indexOf(model)+1}</span><span className="az-photo-type">{model.category} · {model.type}</span></div>
            <div className="az-card-copy"><div className="az-card-meta">{model.years}</div><h3>Ford {model.name}</h3><p>{model.description}</p><div className="az-card-period">{model.period}</div></div>
            <div className="az-card-actions">
              <button type="button" className="az-view-button" aria-expanded={selected===model.name} onClick={()=>setSelected(selected===model.name?"":model.name)}>{selected===model.name?"Hide details":"View details"} <span>{selected===model.name?"−":"↗"}</span></button>
              <a className="az-compare-button" href="/carmodel/specifications/">Explore specifications ↗</a>
            </div>
            {selected===model.name&&<div className="az-inline-detail"><span className="eyebrow">MODEL NOTES / {String(models.indexOf(model)+1).padStart(2,"0")}</span><p>{model.detail}</p><div className="az-highlight-list">{model.highlights.map(item=><span key={item}>{item}</span>)}</div></div>}
          </article>
        ))}
      </div>
      {filteredModels.length===0&&<p className="az-empty-state">No models match that search. Try a model name or year.</p>}
      <p className="az-note">Historical overview only. Specifications and equipment vary by model year, engine option, trim and market. For engineering data and side-by-side comparisons, visit the separate Specification Dashboard.</p>
    </section>,mount
  );
}
