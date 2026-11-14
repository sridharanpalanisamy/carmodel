"use client";

import { useEffect } from "react";

export default function useLegacyScripts(scripts = []) {
  useEffect(() => {
    let cancelled = false;
    const loaded = [];

    const load = async () => {
      for (const src of scripts) {
        if (cancelled) return;
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => {
            loaded.push(script);
            resolve();
          };
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      if (!cancelled) {
        document.dispatchEvent(new Event("DOMContentLoaded"));
      }
    };

    load().catch(error => console.error("Classic Ford page script failed:", error));

    return () => {
      cancelled = true;
      loaded.forEach(script => script.remove());
    };
  }, [scripts]);
}
