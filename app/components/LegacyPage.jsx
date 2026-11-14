"use client";
import { useEffect } from "react";

export default function LegacyPage({ markup, scripts = [] }) {
  useEffect(() => {
    let cancelled = false;
    const loaded = [];
    const menu = document.getElementById("menuToggle");
    const nav = document.getElementById("mainNav");
    const toggleMenu = () => {
      if (!menu || !nav) return;
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    };
    menu?.addEventListener("click", toggleMenu);
    nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      menu?.setAttribute("aria-expanded", "false");
    }));

    const load = async () => {
      for (const src of scripts) {
        if (cancelled) return;
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => { loaded.push(script); resolve(); };
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      if (!cancelled) document.dispatchEvent(new Event("DOMContentLoaded"));
    };
    load().catch(error => console.error("Classic Ford page script failed:", error));
    return () => {
      cancelled = true;
      menu?.removeEventListener("click", toggleMenu);
      loaded.forEach(script => script.remove());
    };
  }, [scripts]);
  return <div className="legacy-page" dangerouslySetInnerHTML={{ __html: markup }} />;
}
