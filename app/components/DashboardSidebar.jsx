"use client";

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

  return (
    <aside className="dashboard-sidebar dashboard-sidebar-icon-rail" aria-label="Ford dashboard navigation">
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
  );
}
