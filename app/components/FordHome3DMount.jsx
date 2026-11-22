"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FordGLBViewer from "./FordGLBViewer";

const SHOWROOM_MODELS = [
  { id: "mustang-1967", name: "1967 Mustang Fastback", path: "/carmodel/models/ford-mustang-1967.glb", credit: "Mark Peters · CC BY 4.0" },
  { id: "model-t", name: "Ford Model T", path: "/carmodel/models/ford-model-t.glb", credit: "OpenGameArt · egore911" },
  { id: "falcon-1973", name: "1973 Falcon GT", path: "/carmodel/models/ford-falcon-gt-1973.glb", credit: "Tom Zimmermann · CC BY 4.0" },
];

function ModelPicker({ selected, available, onSelect }) {
  return <div className="ford-showroom-picker home-model-picker" role="group" aria-label="Choose a classic Ford model">
    {available.map(model => <button key={model.id} type="button" onClick={() => onSelect(model.id)} aria-pressed={selected.id === model.id}>{model.name}</button>)}
  </div>;
}

export default function FordHome3DMount() {
  const [target, setTarget] = useState(null);
  const targetRef = useRef(null);
  const [available, setAvailable] = useState(SHOWROOM_MODELS.slice(0, 2));
  const [selectedId, setSelectedId] = useState("mustang-1967");

  useEffect(() => {
    let cancelled = false;
    const findMount = () => {
      const next = document.getElementById("homeModelMount");
      if (next && next !== targetRef.current && !cancelled) {
        next.style.width = "100%";
        next.style.minWidth = "0";
        targetRef.current = next;
        setTarget(next);
      }
    };
    findMount();
    const observer = new MutationObserver(findMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; observer.disconnect(); targetRef.current = null; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkFalcon() {
      try {
        const response = await fetch(SHOWROOM_MODELS[2].path, { method: "HEAD", cache: "no-store" });
        if (!cancelled && response.ok) setAvailable(SHOWROOM_MODELS);
      } catch { /* Keep the two locally verified models available. */ }
    }
    checkFalcon();
    return () => { cancelled = true; };
  }, []);

  const selected = available.find(model => model.id === selectedId) || available[0];
  if (!target || !selected) return null;
  return createPortal(<div className="ford-showroom home-single-showroom">
    <div className="home-viewer-model-line"><span>NOW VIEWING</span><strong>{selected.name}</strong></div>
    <div className="ford-showroom-picker home-model-picker" role="group" aria-label="Choose a classic Ford model">
      {available.map(model => <button key={model.id} type="button" onClick={() => setSelectedId(model.id)} aria-pressed={selected.id === model.id}>{model.name}</button>)}
    </div>
    <FordGLBViewer key={selected.id} modelPath={selected.path} modelName={selected.name} />
    <div className="studio-model-credit">3D model credit: {selected.credit}. Hosted locally.</div>
  </div>, target);
}
