"use client";

import SiteHeader from "./SiteHeader";
import useLegacyScripts from "../hooks/useLegacyScripts";

export default function LegacyPage({ markup, scripts = [] }) {
  useLegacyScripts(scripts);

  // The original header is now rendered by the shared React component.
  const pageMarkup = markup.replace(/<header class="site-header">[\s\S]*?<\/header>/, "");
  return <><SiteHeader /><div className="legacy-page" dangerouslySetInnerHTML={{ __html: pageMarkup }} /></>;
}
