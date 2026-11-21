"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", page: "home" },
  { href: "/models/", label: "Models", page: "models" },
  { href: "/specifications/", label: "Specifications", page: "specifications" },
  { href: "/engineering/", label: "Engineering", page: "engineering" },
  { href: "/ford-dashboard/", label: "Reference Dashboard", page: "dashboard" },
  { href: "/factory/", label: "Factory Process", page: "factory" },
  { href: "/heritage/", label: "Heritage", page: "heritage" },
  { href: "/contact/", label: "Contact", page: "contact" },
];

export default function SiteHeader() {
  const pathname = (usePathname() || "/").replace(/\\/+$/, "") || "/";
  const [open, setOpen] = useState(false);
  const activePage = pathname === "/ford-dashboard" ? "dashboard"
    : pathname === "/models" ? "models"
    : pathname === "/specifications" ? "specifications"
    : pathname === "/engineering" ? "engineering"
    : pathname === "/factory" ? "factory"
    : pathname === "/heritage" ? "heritage"
    : pathname === "/contact" ? "contact" : "home";

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Classic Ford home">
        <span className="brand-mark">F</span>
        <span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span>
      </Link>
      <button className="menu-toggle" id="menuToggle" type="button"
        aria-label="Toggle navigation" aria-expanded={open}
        onClick={() => setOpen(value => !value)}>☰</button>
      <nav className={`main-nav${open ? " open" : ""}`} id="mainNav" aria-label="Main navigation">
        {links.map(link => (
          <Link key={link.page} className={activePage === link.page ? "active" : ""}
            aria-current={activePage === link.page ? "page" : undefined}
            href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>
        ))}
      </nav>
      <Link className="header-cta" href={activePage === "home" ? "/ford-dashboard/" : "/"}>
        {activePage === "home" ? "Open dashboard" : "Back home"} <span>↗</span>
      </Link>
    </header>
  );
}
