"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const stages = [
  { id:"01", name:"Stamping", area:"Body shop · Sheet metal", title:"Shape the body panels", summary:"Large presses form flat steel or aluminium blanks into doors, hoods, roofs, fenders and structural panels.", steps:["Coils or blanks are inspected and prepared.","Press tools draw, trim and pierce each panel.","Operators and sensors check dimensions and surface condition."], outputs:"Formed body panels", checks:"Panel dimensions, cracks, wrinkles and surface marks", icon:"PRESS" },
  { id:"02", name:"Body welding", area:"Body shop · Body-in-white", title:"Join the body structure", summary:"Robotic and manual joining operations assemble the underbody, sides, roof and closures into a rigid body shell.", steps:["Fixtures locate panels in the correct position.","Resistance spot welding, laser welding, adhesives or other joining methods are applied as specified.","The body geometry and weld quality are checked."], outputs:"Body-in-white shell", checks:"Weld presence, joint strength, dimensional accuracy and gaps", icon:"WELD" },
  { id:"03", name:"Surface preparation", area:"Paint shop · Pretreatment", title:"Prepare the surface", summary:"The body is cleaned and treated so protective coatings can adhere consistently and resist corrosion.", steps:["Cleaners remove oils and process residues.","Rinsing and conversion treatment prepare the metal surface.","An electrocoat layer is applied and cured in a controlled process."], outputs:"Clean, corrosion-protected body", checks:"Bath chemistry, coating coverage, film thickness and cure", icon:"COAT" },
  { id:"04", name:"Paint finishing", area:"Paint shop · Topcoat", title:"Apply colour and finish", summary:"Primer, colour and clearcoat stages build the vehicle's appearance and environmental protection. Exact sequences vary by plant and paint system.", steps:["Primer or surfacer helps create a uniform base.","Robotic or manual systems apply the colour coat.","Clearcoat and curing create the final finish."], outputs:"Painted body", checks:"Colour match, film thickness, gloss, dirt and finish defects", icon:"PAINT" },
  { id:"05", name:"Powertrain preparation", area:"Powertrain · Engine & drive", title:"Prepare the powertrain", summary:"Depending on the vehicle, engines, transmissions, electric drive units, battery packs and related systems are manufactured or supplied and tested for assembly.", steps:["Major components are assembled to the specified build configuration.","Fluids, seals, electrical connections and software are prepared as required.","Subassemblies undergo leak, function or end-of-line checks."], outputs:"Tested powertrain modules", checks:"Torque, leaks, electrical safety, calibration and function", icon:"DRIVE" },
  { id:"06", name:"Final assembly", area:"Trim & chassis · General assembly", title:"Bring the vehicle together", summary:"The painted body is fitted with wiring, interior trim, glass, suspension, wheels, powertrain and other vehicle systems.", steps:["Harnesses, insulation, dashboard and interior parts are installed.","Chassis, suspension and powertrain are married to the body where the line design requires it.","Glass, closures, seats, wheels and finishing parts are fitted."], outputs:"Completed vehicle", checks:"Fastener torque, fit and finish, connector engagement and fluid levels", icon:"BUILD" },
  { id:"07", name:"Quality validation", area:"End of line · Inspection", title:"Verify before release", summary:"Completed vehicles pass checks intended to confirm that safety-related systems, functions, fit and finish meet the plant's release criteria.", steps:["Diagnostic tools check electronic control units and fault codes.","Brake, alignment, lighting, water-leak and functional tests are performed as applicable.","Defects are recorded, corrected and rechecked before release."], outputs:"Inspected vehicle ready for dispatch", checks:"Functional tests, diagnostics, alignment, leaks and final audit", icon:"CHECK" }
];

export default function FactoryProcessExplorer() {
  const [mount, setMount] = useState(null);
  useEffect(() => { setMount(document.getElementById("factoryExplorerMount")); }, []);
  const [active, setActive] = useState(0);
  const stage = stages[active];
  const progress = useMemo(() => ((active + 1) / stages.length) * 100, [active]);
  const move = (step) => setActive(value => Math.min(stages.length - 1, Math.max(0, value + step)));

  return (
    <section className="factory-explorer" aria-labelledby="factoryExplorerTitle">
      <div className="factory-explorer-heading">
        <div><span className="eyebrow">INTERACTIVE PRODUCTION GUIDE</span><h2 id="factoryExplorerTitle">From raw material<br/>to <em>road-ready.</em></h2><p>Choose a production stage to see what happens, what comes out of the process and which quality checks matter.</p></div>
        <div className="factory-index"><strong>07</strong><span>PROCESS<br/>STAGES</span></div>
      </div>
      <div className="factory-progress" aria-label={`Stage ${active + 1} of ${stages.length}`}><span style={{width:progress+"%"}} /></div>
      <div className="factory-stage-nav" role="tablist" aria-label="Vehicle production stages">
        {stages.map((item,index)=><button key={item.id} type="button" role="tab" aria-selected={active===index} className={active===index?"active":""} onClick={()=>setActive(index)}><span>{item.id}</span><strong>{item.name}</strong></button>)}
      </div>
      <article className="factory-stage-detail" role="tabpanel">
        <div className="factory-stage-visual"><span className="factory-stage-number">{stage.id}</span><div className="factory-stage-symbol" aria-hidden="true">{stage.icon}</div><span className="factory-stage-area">{stage.area}</span></div>
        <div className="factory-stage-copy">
          <span className="eyebrow">STAGE {stage.id} / 07</span><h3>{stage.title}</h3><p className="factory-stage-summary">{stage.summary}</p>
          <h4>What happens</h4><ol>{stage.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
          <div className="factory-facts"><div><span>PROCESS OUTPUT</span><strong>{stage.outputs}</strong></div><div><span>KEY QUALITY CHECKS</span><strong>{stage.checks}</strong></div></div>
          <div className="factory-stage-controls"><button type="button" onClick={()=>move(-1)} disabled={active===0}>← Previous</button><span>{active+1} / {stages.length}</span><button type="button" onClick={()=>move(1)} disabled={active===stages.length-1}>Next stage →</button></div>
        </div>
      </article>
      <p className="factory-disclaimer">Educational overview only. This is a typical automotive manufacturing flow, not a verified map of one specific Ford factory or vehicle. Operations, sequence, automation and inspection standards differ by plant, model, material and powertrain.</p>
    </section>
  );
}
