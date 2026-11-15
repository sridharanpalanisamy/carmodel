import LegacyPage from "../components/LegacyPage";
import ModelDialogs from "../components/ModelDialogs";
import VehicleSpecificationDashboard from "../components/VehicleSpecificationDashboard";
import VehicleSystemsExplorer from "../components/VehicleSystemsExplorer";
import ModelDirectory from "../components/ModelDirectory";

const markup = `
<header class="site-header">
  <a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a>
  <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
  <nav class="main-nav" id="mainNav" aria-label="Main navigation">
    <a href="/carmodel/">Home</a><a class="active" href="/carmodel/models/">Models</a><a href="/carmodel/heritage/">Heritage</a><a href="/carmodel/contact/">Contact</a>
  </nav>
  <a class="header-cta" href="/carmodel/">Back home <span>↗</span></a>
</header>
<main class="page-shell inner-page models-directory-page">
  <section class="az-page-heading">
    <span class="eyebrow">THE FORD HERITAGE COLLECTION</span>
    <h1>11 selected Ford <em>models.</em></h1>
    <p>Browse 11 selected historic Ford models, open a model to view its details, and compare their reference specifications from the dashboard.</p>
  </section>
  <div id="azArchiveMount"></div>
  <nav class="directory-more-links" aria-label="More Ford information">
    <a href="#spec-dashboard"><span>01</span><span><strong>Compare vehicle specifications</strong><small>Compare two Ford models side by side</small></span><b>↗</b></a>
    <a href="#vehicle-systems"><span>02</span><span><strong>Explore vehicle engineering systems</strong><small>Understand the main systems and components</small></span><b>↗</b></a>
  </nav>
  <div id="specDashboardMount"></div><div id="vehicleSystemsMount"></div>
</main>
<footer class="site-footer inner-footer">
  <a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a>
  <p>A visual tribute to the cars that moved generations.</p>
  <div class="footer-bottom"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div>
</footer>`;
const scripts = ["/carmodel/scripts/local-3d-viewer.js"];
export default function Page() {
  return <>
    <link rel="stylesheet" href="/carmodel/pages.css?v=20261115-models-11-only" />
    <LegacyPage markup={markup} scripts={scripts} />
    <ModelDialogs />
    <ModelDirectory />
    <VehicleSpecificationDashboard />
    <VehicleSystemsExplorer />
  </>;
}
