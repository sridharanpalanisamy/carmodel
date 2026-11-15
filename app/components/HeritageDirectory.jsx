"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const entries = [
  ["Bronco","1966–present","SUV / 4×4"],["Cortina","1962–1982","Passenger car"],["Country Squire","1950–1991","Wagon"],["Courier","1972–present","Pickup / commercial"],["Deluxe","1938–1940","Classic car"],["E-Series","1961–present","Van"],["EcoSport","2003–2022","Compact SUV"],["Edge","2006–2024","SUV"],["Escape","2000–present","SUV"],["Everest","2003–present","SUV"],["Explorer","1991–present","SUV"],["F-Series","1948–present","Pickup trucks"],["Fairlane","1955–1970","Passenger car"],["Falcon","1960–1970","Compact car"],["Fiesta","1976–2023","Hatchback"],["Focus","1998–present","Passenger car"],["GT","2004–present","Sports car"],["GT40","1964–1969","Motorsport"],["Ka","1996–2021","City car"],["Maverick","1970–1977; 2021–present","Car / pickup"],["Model A","1927–1931","Vintage car"],["Model T","1908–1927","Vintage car"],["Mondeo","1992–2022","Passenger car"],["Mustang","1964–present","Pony / sports car"],["Mustang Mach-E","2021–present","Electric SUV"],["Pinto","1971–1980","Subcompact car"],["Ranger","1983–present","Pickup"],["S-Max","2006–2023","MPV"],["Taunus","1939–1994","Passenger car"],["Taurus","1986–2019","Passenger car"],["Thunderbird","1955–2005","Personal luxury"],["Transit","1965–present","Commercial van"],["Transit Connect","2002–2023","Commercial van"],["Windstar","1994–2003","Minivan"]
];

export default function HeritageDirectory(){
 const [mount,setMount]=useState(null);
 useEffect(()=>{setMount(document.getElementById("heritageDirectoryMount"));},[]);
 if(!mount) return null;
 return createPortal(<div className="heritage-directory">
  <div className="heritage-directory-tools"><span>{entries.length} NAMEPLATES LISTED</span><span>ALPHABETICAL INDEX</span></div>
  <div className="heritage-directory-grid">{entries.map(([name,years,type])=><a className="heritage-directory-item" key={name} href="/carmodel/models/"><span className="heritage-directory-letter">{name[0]}</span><span className="heritage-directory-name">Ford {name}<small>{years}</small></span><span className="heritage-directory-type">{type}</span><span className="heritage-directory-arrow">↗</span></a>)}</div>
  <p className="heritage-directory-note">Select a nameplate to open the visual vehicle collection. Production dates and availability vary by region and generation.</p>
 </div>,mount);
}
