"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FordGLBViewer from "./FordGLBViewer";

const SHOWROOM_MODELS = [
  { id: "model-t", name: "Ford Model T", path: "/carmodel/models/ford-model-t.glb", credit: "OpenGameArt · egore911" },
  { id: "mustang-1967", name: "1967 Mustang Fastback", path: "/carmodel/models/ford-mustang-1967.glb", credit: "Mark Peters · CC BY 4.0" },
  { id: "falcon-1973", name: "1973 Falcon GT", path: "/carmodel/models/ford-falcon-gt-1973.glb", credit: "Tom Zimmermann · CC BY 4.0" },
];

function ModelPicker({ selected, available, onSelect, label }) {
  return (
    <div className="ford-showroom-picker" role="group" aria-label={label}>
      {available.map((model) => (
        <button key={model.id} type="button" onClick={() => onSelect(model.id)}
          aria-pressed={selected.id === model.id}>
          {model.name}
        </button>
      ))}
    </div>
  );
}

export default function FordHome3DMount() {
  const [targets, setTargets] = useState({ mustang: null, modelT: null });
  const targetsRef = useRef({});
  const [available, setAvailable] = useState(SHOWROOM_MODELS.slice(0, 2));
  const [mustangId, setMustangId] = useState("mustang-1967");
  const [modelTId, setModelTId] = useState("model-t");

  useEffect(() => {
    let cancelled = false;
    const findMounts = () => {
      const next = {
        mustang: document.getElementById("homeModelMustangMount"),
        modelT: document.getElementById("homeModelTMount"),
      };
      const changed = Object.keys(next).some((key) => next[key] && targetsRef.current[key] !== next[key]);
      if (changed && !cancelled) {
        Object.values(next).forEach((mount) => {
          if (mount) {
            mount.style.width = "100%";
            mount.style.minWidth = "0";
          }
        });
        targetsRef.current = next;
        setTargets(next);
      }
    };
    findMounts();
    const observer = new MutationObserver(findMounts);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelled = true;
      observer.disconnect();
      targetsRef.current = {};
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkAssets() {
      const falcon = SHOWROOM_MODELS[2];
      try {
        const response = await fetch(falcon.path, { method: "HEAD", cache: "no-store" });
        if (!cancelled && response.ok) setAvailable(SHOWROOM_MODELS);
      } catch {
        // Keep the two verified local models available if Falcon is absent.
      }
    }
    checkAssets();
    return () => { cancelled = true; };
  }, []);

  const mustang = available.find((model) => model.id === mustangId) || available[1] || available[0];
  const modelT = available.find((model) => model.id === modelTId) || available[0];

  return (
    <>
      {targets.mustang && createPortal(
        <div className="ford-showroom studio-viewer">
          <ModelPicker selected={mustang} available={available} onSelect={setMustangId} label="Choose the left studio vehicle" />
          <FordGLBViewer key={mustang.id} modelPath={mustang.path} modelName={mustang.name} />
          <div className="studio-model-credit">3D model credit: {mustang.credit}. Hosted locally.</div>
        </div>,
        targets.mustang
      )}
      {targets.modelT && createPortal(
        <div className="ford-showroom studio-viewer">
          <ModelPicker selected={modelT} available={available} onSelect={setModelTId} label="Choose the right studio vehicle" />
          <FordGLBViewer key={modelT.id} modelPath={modelT.path} modelName={modelT.name} />
          <div className="studio-model-credit">3D model credit: {modelT.credit}. Hosted locally.</div>
        </div>,
        targets.modelT
      )}
    </>
  );
}
