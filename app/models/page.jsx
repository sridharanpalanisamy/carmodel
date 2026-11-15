import LegacyPage from "../components/LegacyPage";
import ModelDirectory from "../components/ModelDirectory";
import VehicleSpecificationDashboard from "../components/VehicleSpecificationDashboard";

const markup = `
<header class="site-header">
  <a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a>
  <button class="menu-toggle" id="menuToggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
  <nav class="main-nav" id="mainNav" aria-label="Main navigation">
    <a href="/carmodel/">Home</a><a class="active" href="/carmodel/models/">Models</a><a href="/carmodel/heritage/">Heritage</a><a href="/carmodel/contact/">Contact</a>
  </nav>
  <a class="header-cta" href="/carmodel/">Back home <span>↗</span></a>
</header>
<main class="page-shell inner-page models-directory-page models-photo-page">
  <section class="az-page-heading">
    <span class="eyebrow">THE FORD HERITAGE COLLECTION</span>
    <h1>11 Ford <em>icons.</em></h1>
    <p>Photographs and short histories of the 11 selected models, followed by a direct specification comparison.</p>
  </section>
  <div id="azArchiveMount"></div>
  <div id="specDashboardMount"></div>
</main>
<footer class="site-footer inner-footer">
  <a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a>
  <p>A visual tribute to the cars that moved generations.</p>
  <div class="footer-bottom"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div>
</footer>`;
export default function Page() {
  return <>
    <link rel="stylesheet" href="/carmodel/pages.css?v=20261115-models-photo-upgrade-1" />
    <LegacyPage markup={markup} />
    <ModelDirectory />
    <VehicleSpecificationDashboard />
  </>;
}
