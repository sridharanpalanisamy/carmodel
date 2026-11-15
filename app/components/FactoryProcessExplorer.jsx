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


function StageSymbol({ type }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    PRESS: <><path d="M7 21h10M9 17h6M10 17V9h4v8M6 9h12M8 5h8M12 2v3M4 21h16" /><path d="M8 9l-2 3h12l-2-3" /></>,
    WELD: <><path d="M4 20l5-5 3 3 8-9M16 5l3-2 2 3-3 2z" /><path d="M5 5l1.5 2M3 9l3 1M10 3l-.5 2M19 14l2 1M17 18l2 2" /></>,
    COAT: <><path d="M5 4h14l-1 5H6L5 4zM7 9v11h10V9M10 13h4M10 16h4" /><path d="M3 2l2 2M21 2l-2 2" /></>,
    PAINT: <><path d="M4 8h10l3 3-3 3H4zM14 8l3-3h3v6h-3M8 14v5M5 19h6" /><path d="M20 14l1 2M18 16l1 2M22 18l1 2" /></>,
    DRIVE: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
    BUILD: <><path d="M3 14l2-5h14l2 5v5H3zM5 14h14M7 19v2M17 19v2" /><path d="M7 9l2-4h6l2 4M8 14v2M16 14v2" /></>,
    CHECK: <><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><path d="M8 12l3 3 5-6" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>{paths[type] || paths.CHECK}</svg>;
}

function FactoryUnitVisual({ stage }) {
  const shared = <><path className="unit-floor" d="M18 224H382"/><path className="unit-rail" d="M28 205H372M28 214H372"/><circle className="unit-wheel" cx="72" cy="210" r="7"/><circle className="unit-wheel" cx="328" cy="210" r="7"/></>;
  let machine;
  if (stage.id === "01") machine = <><path className="unit-frame" d="M104 42V188M296 42V188M104 48H296M104 188H296"/><rect className="unit-machine" x="126" y="48" width="148" height="24" rx="3"/><path className="unit-arm" d="M200 72V116"/><rect className="unit-machine" x="164" y="112" width="72" height="16" rx="2"/><path className="unit-part" d="M140 160Q200 132 260 160L248 178H152Z"/><path className="unit-detail" d="M88 188H312M112 42H288"/></>;
  else if (stage.id === "02") machine = <><path className="unit-frame" d="M44 176V78H92V176M308 176V78H356V176"/><path className="unit-arm" d="M68 112L108 88L137 115L158 130M332 112L292 88L263 115L242 130"/><circle className="unit-joint" cx="108" cy="88" r="7"/><circle className="unit-joint" cx="292" cy="88" r="7"/><path className="unit-part" d="M132 144L151 116H249L268 144L254 165H146Z"/><path className="unit-detail" d="M152 116L160 144M248 116L240 144M200 116V164"/><path className="unit-spark" d="M126 126l-8 -8m10 3l-1 -12m-8 18l-12 2M274 126l8 -8m-10 3l1 -12m8 18l12 2"/></>;
  else if (stage.id === "03") machine = <><path className="unit-frame" d="M48 66H352V184H48Z"/><path className="unit-detail" d="M48 92H352M48 176H352"/><path className="unit-liquid" d="M56 128H126V176H56ZM165 128H235V176H165ZM274 128H344V176H274Z"/><path className="unit-part" d="M112 82L130 68H270L288 82L278 106H122Z"/><path className="unit-arm" d="M200 40V68M188 52L200 40L212 52"/><circle className="unit-bubble" cx="90" cy="150" r="4"/><circle className="unit-bubble" cx="198" cy="150" r="5"/><circle className="unit-bubble" cx="310" cy="150" r="4"/></>;
  else if (stage.id === "04") machine = <><path className="unit-frame" d="M46 54H354V188H46Z"/><path className="unit-detail" d="M72 54V188M328 54V188M46 82H354"/><path className="unit-part" d="M122 132L144 104H256L278 132L266 157H134Z"/><path className="unit-arm" d="M82 104L108 94L128 112L142 120M318 104L292 94L272 112L258 120"/><path className="unit-spray" d="M144 92l-8 -14m18 14l-2 -17m10 17l4 -14M238 92l8 -14m-18 14l2 -17m-10 17l-4 -14"/><path className="unit-detail" d="M144 164H256"/></>;
  else if (stage.id === "05") machine = <><path className="unit-frame" d="M74 64H326V184H74Z"/><rect className="unit-machine" x="132" y="82" width="136" height="76" rx="8"/><path className="unit-detail" d="M146 96H254M146 144H254M168 82V158M232 82V158"/><circle className="unit-wheel" cx="151" cy="120" r="13"/><circle className="unit-wheel" cx="249" cy="120" r="13"/><path className="unit-part" d="M180 94H220L232 120L220 146H180L168 120Z"/><path className="unit-arm" d="M200 38V78M188 50L200 38L212 50"/><path className="unit-detail" d="M94 184V196M306 184V196"/></>;
  else if (stage.id === "06") machine = <><path className="unit-frame" d="M42 52H358V184H42Z"/><path className="unit-detail" d="M70 52V184M330 52V184M42 76H358"/><path className="unit-part" d="M104 130L128 96H272L296 130L282 158H118Z"/><path className="unit-detail" d="M150 98L160 130H240L250 98M126 158V174M274 158V174"/><circle className="unit-wheel" cx="138" cy="158" r="13"/><circle className="unit-wheel" cx="262" cy="158" r="13"/><path className="unit-arm" d="M82 72L108 86L130 108M318 72L292 86L270 108"/></>;
  else machine = <><path className="unit-frame" d="M88 46H312V188H88Z"/><path className="unit-detail" d="M108 46V188M292 46V188M88 78H312"/><path className="unit-part" d="M124 132L144 102H256L276 132L264 158H136Z"/><circle className="unit-wheel" cx="150" cy="158" r="12"/><circle className="unit-wheel" cx="250" cy="158" r="12"/><path className="unit-scan" d="M108 96V66H292V96M124 66V52M276 66V52"/><path className="unit-detail" d="M200 50V90M188 80L200 92L212 80"/><path className="unit-check" d="M310 104l10 10l20 -24"/></>;
  return <div className="factory-unit-illustration">
    <div className="factory-unit-topline"><span>MANUFACTURING UNIT</span><span>{stage.id} / 07</span></div>
    <svg viewBox="0 0 400 250" role="img" aria-label={stage.name + " manufacturing unit illustration"}>{shared}{machine}</svg>
    <div className="factory-unit-caption"><span className="factory-unit-dot"/>{stage.area}</div>
  </div>;
}
export default function FactoryProcessExplorer() {
  const [mount, setMount] = useState(null);
  useEffect(() => { setMount(document.getElementById("factoryExplorerMount")); }, []);
  const [active, setActive] = useState(0);
  const stage = stages[active];
  const progress = useMemo(() => ((active + 1) / stages.length) * 100, [active]);
  const move = (step) => setActive(value => Math.min(stages.length - 1, Math.max(0, value + step)));

  if (!mount) return null;
  return createPortal(
    <section className="factory-explorer" aria-labelledby="factoryExplorerTitle">
      <div className="factory-explorer-heading">
        <div><span className="eyebrow">INTERACTIVE PRODUCTION GUIDE</span><h2 id="factoryExplorerTitle">From raw material<br/>to <em>road-ready.</em></h2><p>Choose a production stage to see what happens, what comes out of the process and which quality checks matter.</p></div>
        <div className="factory-index"><strong>07</strong><span>PROCESS<br/>STAGES</span></div>
      </div>
      <div className="factory-flow-header"><span>PRODUCTION FLOW MAP</span><small>Select any node to inspect that manufacturing unit</small></div>
      <div className="factory-flow-scroll">
        <div className="factory-flow-track" role="group" aria-label="Choose a vehicle manufacturing stage">
          {stages.map((item,index)=><div className="factory-flow-step" key={item.id}>
            <button type="button" className={active===index?"factory-flow-node active":"factory-flow-node"} aria-pressed={active===index} aria-label={`Show ${item.name} details`} onClick={()=>setActive(index)}>
              <span className="factory-flow-node-number">{item.id}</span>
              <span className="factory-flow-node-icon"><StageSymbol type={item.icon} /></span>
              <strong>{item.name}</strong>
              <small>{item.area.split(" · ")[0]}</small>
            </button>
            {index<stages.length-1?<div className={active>index?"factory-flow-edge passed":"factory-flow-edge"} aria-hidden="true"><i /></div>:null}
          </div>)}
        </div>
      </div>
      <div className="factory-progress" aria-label={`Stage ${active + 1} of ${stages.length}`}><span style={{width:progress+"%"}} /></div>
      <article className="factory-stage-detail" role="tabpanel">
        <div className="factory-stage-visual"><FactoryUnitVisual stage={stage} /></div>
        <div className="factory-stage-copy">
          <span className="eyebrow">STAGE {stage.id} / 07</span><h3>{stage.title}</h3><p className="factory-stage-summary">{stage.summary}</p>
          <h4>What happens</h4><ol>{stage.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
          <div className="factory-facts"><div><span>PROCESS OUTPUT</span><strong>{stage.outputs}</strong></div><div><span>KEY QUALITY CHECKS</span><strong>{stage.checks}</strong></div></div>
          <div className="factory-stage-controls"><button type="button" onClick={()=>move(-1)} disabled={active===0}>← Previous</button><span>{active+1} / {stages.length}</span><button type="button" onClick={()=>move(1)} disabled={active===stages.length-1}>Next stage →</button></div>
        </div>
      </article>
      <p className="factory-disclaimer">Educational overview only. This is a typical automotive manufacturing flow, not a verified map of one specific Ford factory or vehicle. Operations, sequence, automation and inspection standards differ by plant, model, material and powertrain.</p>
    </section>,
    mount
  );
}
