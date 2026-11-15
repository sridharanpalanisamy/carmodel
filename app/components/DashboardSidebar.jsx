"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/ford-dashboard/", label: "Overview", code: "01", icon: "⌂", match: ["/ford-dashboard"] },
  { href: "/models/", label: "Ford Models", code: "02", icon: "▤", match: ["/models"] },
  { href: "/specifications/", label: "Comparison", code: "03", icon: "⇄", match: ["/specifications"] },
  { href: "/engineering/", label: "Engineering", code: "04", icon: "⚙", match: ["/engineering"] },
  { href: "/factory/", label: "Factory Process", code: "05", icon: "⌁", match: ["/factory"] },
  { href: "/heritage/", label: "Heritage", code: "06", icon: "◷", match: ["/heritage"] }
];

export default function DashboardSidebar() {
  const rawPathname = usePathname() || "/";
  const pathname = rawPathname.endsWith("/") ? rawPathname.slice(0, -1) : rawPathname;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = event => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={open ? "dashboard-sidebar-toggle is-open" : "dashboard-sidebar-toggle"}
        onClick={() => setOpen(value => !value)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="ford-workspace-navigation"
        title={open ? "Close menu" : "Open menu"}
      >
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      {open && (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation menu"
          tabIndex={-1}
        />
      )}
      <aside
        id="ford-workspace-navigation"
        className={open ? "dashboard-sidebar dashboard-sidebar-icon-rail is-open" : "dashboard-sidebar dashboard-sidebar-icon-rail"}
        aria-label="Ford dashboard navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="dashboard-sidebar-brand" title="Ford Workspace">
          <span className="dashboard-sidebar-mark">F</span>
        </div>
        <nav className="dashboard-sidebar-nav" aria-label="Workspace pages">
          {items.map(item => {
            const active = item.match.some(path => pathname.endsWith(path));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={active ? "dashboard-sidebar-link active" : "dashboard-sidebar-link"}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={item.label}
              >
                <span className="dashboard-sidebar-code" aria-hidden="true">{item.code}</span>
                <span className="dashboard-sidebar-icon" aria-hidden="true">{item.icon}</span>
                <span className="dashboard-sidebar-link-label">{item.label}</span>
                <span className="dashboard-sidebar-arrow" aria-hidden="true">↗</span>
              </Link>
            );
          })}
        </nav>
        <div className="dashboard-sidebar-foot" title="Ford Heritage Data">
          <span className="dashboard-sidebar-status" aria-label="Workspace active"></span>
        </div>
      </aside>
    </>
  );
}
