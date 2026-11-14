"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FordGLBViewer from "./FordGLBViewer";

export default function FordHome3DMount() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const mount = document.getElementById("homeModelTGLBMount");
    if (mount) setTarget(mount);
  }, []);

  if (!target) return null;
  return createPortal(<FordGLBViewer />, target);
}
