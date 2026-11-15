"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const systems = [
  { id:"engine", number:"01", name:"Engine", type:"POWER GENERATION", summary:"Converts fuel energy into mechanical power to move the vehicle.", function:"The engine draws in air and fuel, compresses the mixture, ignites it and turns the resulting pressure into crankshaft rotation.", parts:["Cylinder block and cylinder head","Pistons, connecting rods and crankshaft","Valvetrain and camshaft","Fuel, ignition and lubrication systems"], flow:"Air + fuel → combustion → piston movement → crankshaft rotation", check:"Oil level and condition, coolant level, belts, leaks and unusual noise." },
  { id:"transmission", number:"02", name:"Transmission", type:"POWER DELIVERY", summary:"Controls how engine torque and speed reach the driven wheels.", function:"Gear ratios adapt the engine's output to starting, acceleration, cruising and load conditions. The final drive transfers torque to the axle or wheels.", parts:["Clutch or torque converter","Gear sets and shafts","Gear selector and control system","Differential and final drive"], flow:"Engine → clutch / converter → gearset → final drive → wheels", check:"Fluid condition and leaks, shift quality, clutch engagement and abnormal vibration." },
  { id:"chassis", number:"03", name:"Chassis & frame", type:"STRUCTURAL FOUNDATION", summary:"Supports the vehicle and provides mounting points for major systems.", function:"The structure carries passenger, cargo and component loads. It also helps manage forces from braking, cornering and road impacts.", parts:["Frame rails or body structure","Crossmembers and mounting points","Subframes and reinforcements","Body attachment and load paths"], flow:"Vehicle loads → structural members → suspension and body mounts", check:"Corrosion, cracks, damaged mounting points, loose fasteners and alignment." },
  { id:"suspension", number:"04", name:"Suspension", type:"RIDE & ROAD CONTROL", summary:"Keeps the tyres in contact with the road while managing movement and impact.", function:"Springs support vehicle weight while dampers control oscillation. Linkages guide wheel movement and help maintain tyre geometry.", parts:["Coil, leaf or torsion springs","Shock absorbers or struts","Control arms and links","Bushings, joints and stabilizer bar"], flow:"Road input → spring movement → damper control → tyre contact", check:"Uneven tyre wear, leaking dampers, worn bushings, noises and ride height." },
  { id:"brakes", number:"05", name:"Braking system", type:"SPEED CONTROL & SAFETY", summary:"Creates controlled friction to slow or stop the vehicle.", function:"Pedal force is amplified and transmitted hydraulically or mechanically. Brake pads or shoes create friction at the rotating disc or drum.", parts:["Brake pedal and booster","Master cylinder and hydraulic lines","Disc, drum, pads or shoes","ABS sensors and control unit where fitted"], flow:"Pedal input → force transmission → friction at wheels → deceleration", check:"Pad or shoe wear, fluid level, leaks, pulling, vibration and warning lamps." },
  { id:"electrical", number:"06", name:"Electrical system", type:"ENERGY & CONTROL", summary:"Supplies electrical power and coordinates vehicle functions.", function:"The battery supplies stored energy, the charging system replenishes it, and wiring and control modules distribute power and signals to vehicle systems.", parts:["Battery and charging system","Starter motor and alternator","Wiring harnesses, fuses and relays","Sensors, switches and control modules"], flow:"Battery / alternator → distribution → sensors and actuators", check:"Battery condition, charging voltage, damaged wiring, grounds and blown fuses." }
];

function SystemIcon({ id }) {
  const paths = {
    engine:<><path d="M5 9h14l2 3v7H4v-7z"/><path d="M8 9V6h8v3M8 19v2m8-2v2M2 12h2m18 0h2M9 13h6"/></>,
    transmission:<><path d="M4 7h16v10H4z"/><path d="M8 7V4m8 3V4M8 17v3m8-3v3M7 11h3m4 2h3"/><circle cx="12" cy="12" r="2"/></>,
    chassis:<><path d="M3 7h18v10H3z"/><path d="M6 7v10m12-10v10M3 10h18M3 14h18"/><circle cx="6" cy="19" r="1"/><circle cx="18" cy="19" r="1"/></>,
    suspension:<><path d="M12 3v3l-3 2 6 3-6 3 6 3-3 2v2"/><path d="M5 5h14M5 19h14"/></>,
    brakes:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M17 5l3 3v8l-3 3"/></>,
    electrical:<><path d="M10 3L5 13h6l-1 8 9-12h-6l1-6z"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[id]}</svg>;
}

export default function VehicleSystemsExplorer() {
  const [mount, setMount] = useState(null);
  const [activeId, setActiveId] = useState("engine");
  useEffect(() => { setMount(document.getElementById("vehicleSystemsMount")); }, []);
  const active = systems.find(item => item.id === activeId) || systems[0];
  if (!mount) return null;
  return createPortal(
    <section className="vehicle-systems" aria-labelledby="vehicleSystemsTitle">
      <div className="vehicle-systems-heading">
        <div><span className="eyebrow">PROJECT 10 / INTERACTIVE ENGINEERING</span><h2 id="vehicleSystemsTitle">Explore the vehicle <em>systems.</em></h2><p>Select a system to understand its purpose, main components and basic inspection points.</p></div>
        <span className="vehicle-systems-index">SYSTEMS / 06</span>
      </div>
      <div className="vehicle-systems-layout">
        <nav className="vehicle-system-list" aria-label="Vehicle systems">
          {systems.map(item => <button type="button" key={item.id} className={item.id === activeId ? "vehicle-system-choice active" : "vehicle-system-choice"} aria-pressed={item.id === activeId} onClick={() => setActiveId(item.id)}>
            <span className="vehicle-system-icon"><SystemIcon id={item.id}/></span><span className="vehicle-system-label"><small>{item.number} / {item.type}</small><strong>{item.name}</strong></span><span className="vehicle-system-arrow">↗</span>
          </button>)}
        </nav>
        <article className="vehicle-system-detail" aria-live="polite">
          <div className="vehicle-system-detail-top"><span>{active.number} / {active.type}</span><span>GENERAL AUTOMOTIVE OVERVIEW</span></div>
          <div className="vehicle-system-title-row"><span className="vehicle-system-large-icon"><SystemIcon id={active.id}/></span><div><h3>{active.name}</h3><p>{active.summary}</p></div></div>
          <div className="vehicle-system-section"><h4>HOW IT WORKS</h4><p>{active.function}</p><div className="vehicle-system-flow">{active.flow}</div></div>
          <div className="vehicle-system-section"><h4>MAIN COMPONENTS</h4><ul>{active.parts.map(part => <li key={part}>{part}</li>)}</ul></div>
          <div className="vehicle-system-check"><strong>INSPECTION POINTS</strong><p>{active.check}</p></div>
          <div className="vehicle-system-controls"><button type="button" onClick={() => setActiveId(systems[(systems.findIndex(item => item.id === activeId) + systems.length - 1) % systems.length].id)}>← Previous</button><span>{systems.findIndex(item => item.id === activeId) + 1} / {systems.length}</span><button type="button" onClick={() => setActiveId(systems[(systems.findIndex(item => item.id === activeId) + 1) % systems.length].id)}>Next →</button></div>
        </article>
      </div>
      <p className="vehicle-systems-note">Educational overview only. Component layouts and equipment vary by Ford model, model year, market and powertrain; this is not a model-specific service manual.</p>
    </section>,
    mount
  );
}
