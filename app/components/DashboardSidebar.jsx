"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/ford-dashboard/", label: "Overview", code: "01", icon: "⌂", match: ["/ford-dashboard"] },
  { href: "/models/", label: "Ford Models", code: "02", icon: "▤", match: ["/models"] },
  { href: "/specifications/", label: "Comparison", code: "03", icon: "⇄", match: ["/specifications"] },
  { href: "/engineering/", label: "Engineering", code: "04", icon: "⚙", match: ["/engineering"] },
  { href: "/factory/", label: "Factory Process", code: "05", icon: "⌁", match: ["/factory"] }
];

export default function DashboardSidebar() {
  const pathname = (usePathname() || "/").replace(/\/+$/, "");
  return (
    <aside className="dashboard-sidebar" aria-label="Ford dashboard navigation">
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
