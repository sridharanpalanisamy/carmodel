"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/ford-dashboard/", label: "Overview", code: "01", icon: "⌂", match: ["/ford-dashboard"] },
  { href: "/models/", label: "Ford Models", code: "02", icon: "▤", match: ["/models"] },
  { href: "/specifications/", label: "Comparison", code: "03", icon: "⇄", match: ["/specifications"] },
  { href: "/engineering/", label: "Engineering", code: "04", icon: "⚙", match: ["/engineering"] },
  { href: "/factory/", label: "Factory Process", code: "05", icon: "⌁", match: ["/factory"] }
];

const DEFAULT_POSITION = { x: 0, y: 70 };

export default function DashboardSidebar() {
  const pathname = (usePathname() || "/").replace(/\\/+$/, "");
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const dragOffset = useRef(null);
  const positionRef = useRef(DEFAULT_POSITION);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("ford-workspace-sidebar-position") || "null");
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        const restored = {
          x: Math.max(0, Math.min(saved.x, window.innerWidth - 90)),
          y: Math.max(0, Math.min(saved.y, window.innerHeight - 100))
        };
        positionRef.current = restored;
        setPosition(restored);
      }
    } catch {}
  }, []);

  function startDrag(event) {
    if (event.target.closest("button")) return;
    event.preventDefault();
    dragOffset.current = { x: event.clientX - position.x, y: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!dragOffset.current) return;
    const width = window.matchMedia("(max-width: 760px)").matches ? Math.min(window.innerWidth * 0.9, 360) : 244;
    const x = Math.max(0, Math.min(event.clientX - dragOffset.current.x, window.innerWidth - width));
    const y = Math.max(0, Math.min(event.clientY - dragOffset.current.y, window.innerHeight - 90));
    const next = { x, y };
    positionRef.current = next;
    setPosition(next);
  }

  function endDrag() {
    if (!dragOffset.current) return;
    dragOffset.current = null;
    try { window.localStorage.setItem("ford-workspace-sidebar-position", JSON.stringify(positionRef.current)); } catch {}
  }

  function resetPosition() {
    positionRef.current = DEFAULT_POSITION;
    setPosition(DEFAULT_POSITION);
    try { window.localStorage.removeItem("ford-workspace-sidebar-position"); } catch {}
  }

  return (
    <aside className={"dashboard-sidebar dashboard-sidebar-movable" + (position.x !== 0 || position.y !== 70 ? " is-moved" : "")} aria-label="Ford dashboard navigation"
      style={{ "--sidebar-x": position.x + "px", "--sidebar-y": position.y + "px" }}>
      <div className="dashboard-sidebar-dragbar" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <span className="dashboard-sidebar-drag-handle" aria-hidden="true">⠿</span>
        <span className="dashboard-sidebar-drag-label">DRAG TO MOVE</span>
        <button type="button" className="dashboard-sidebar-reset" onClick={resetPosition} title="Return sidebar to its default position">Reset</button>
      </div>
      <div className="dashboard-sidebar-brand">
        <span className="dashboard-sidebar-mark">F</span>
        <span><strong>FORD WORKSPACE</strong><small>KNOWLEDGE CENTRE</small></span>
      </div>
      <div className="dashboard-sidebar-label">WORKSPACE</div>
      <nav className="dashboard-sidebar-nav">
        {items.map(item => {
          const active = item.match.some(path => pathname.endsWith(path));
          return <Link key={item.href} href={item.href} className={active ? "dashboard-sidebar-link active" : "dashboard-sidebar-link"} aria-current={active ? "page" : undefined}>
            <span className="dashboard-sidebar-code">{item.code}</span><span className="dashboard-sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><span className="dashboard-sidebar-arrow">↗</span>
          </Link>;
        })}
      </nav>
      <div className="dashboard-sidebar-foot"><span className="dashboard-sidebar-status"></span><span>FORD HERITAGE DATA</span><small>Independent reference workspace</small></div>
    </aside>
  );
}
