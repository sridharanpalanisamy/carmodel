"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FordGLBViewer from "./FordGLBViewer";

const SHOWROOM_MODELS = [
  { id: "model-t", name: "Ford Model T", path: "/carmodel/models/ford-model-t.glb", credit: "OpenGameArt · egore911" },
  { id: "mustang-1967", name: "1967 Mustang Fastback", path: "/carmodel/models/ford-mustang-1967.glb", credit: "Mark Peters · CC BY 4.0" },
  { id: "falcon-1973", name: "1973 Falcon GT", path: "/carmodel/models/ford-falcon-gt-1973.glb", credit: "Tom Zimmermann · CC BY 4.0" },
];

export default function FordHome3DMount() {
  const [target, setTarget] = useState(null);
  const [available, setAvailable] = useState([SHOWROOM_MODELS[0], SHOWROOM_MODELS[1]]);
  const [selectedId, setSelectedId] = useState("mustang-1967");

  useEffect(() => {
    let observer;
    let cancelled = false;
    const findMount = () => {
      const mount = document.getElementById("homeModelTGLBMount");
      if (mount && !cancelled) {
        mount.style.width = "100%";
        mount.style.minWidth = "0";
        setTarget(mount);
        observer?.disconnect();
      }
    };
    findMount();
    if (!document.getElementById("homeModelTGLBMount")) {
      observer = new MutationObserver(findMount);
      observer.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkAssets() {
      const results = await Promise.all(SHOWROOM_MODELS.slice(1).map(async (model) => {
        try {
          const response = await fetch(model.path, { method: "HEAD", cache: "no-store" });
          return response.ok ? model : null;
        } catch {
          return null;
        }
      }));
      if (!cancelled) setAvailable([SHOWROOM_MODELS[0], ...results.filter(Boolean)]);
    }
    checkAssets();
    return () => { cancelled = true; };
  }, []);

  if (!target) return null;
  const selected = available.find((model) => model.id === selectedId) || available[0];

  return createPortal(
    <div className="ford-showroom">
      <div className="ford-showroom-picker" role="group" aria-label="Choose a Ford 3D model" style={{display:"flex",gap:"8px",flexWrap:"wrap",padding:"12px 0"}}>
        {available.map((model) => (
          <button key={model.id} type="button" onClick={() => setSelectedId(model.id)} aria-pressed={selected.id === model.id}
            style={{border:"1px solid #b9b5ae",padding:"9px 12px",fontSize:"10px",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",background:selected.id === model.id ? "#df5a2b" : "transparent",color:selected.id === model.id ? "#fff" : "inherit",cursor:"pointer"}}>
            {model.name}
          </button>
        ))}
      </div>
      <FordGLBViewer key={selected.id} modelPath={selected.path} modelName={selected.name} />
      <div style={{fontSize:"10px",padding:"8px 2px",opacity:.75}}>3D model credit: {selected.credit}. The model is served locally by this website.</div>
    </div>,
    target
  );
}
