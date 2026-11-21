import LegacyPage from "../components/LegacyPage";
import VehicleSystemsExplorer from "../components/VehicleSystemsExplorer";

const markup = `
<main class="page-shell inner-page engineering-workspace-page">
  <section class="az-page-heading"><span class="eyebrow">FORD WORKSPACE / TECHNICAL LIBRARY</span><h1>Vehicle <em>engineering.</em></h1><p>Explore the purpose, key components, operating flow and inspection points of the major systems found in road vehicles.</p></section>
  <div id="vehicleSystemsMount"></div>
</main>
<footer class="site-footer inner-footer"><a class="brand" href="/carmodel/"><span class="brand-mark">F</span><span>CLASSIC FORD<small>THE HERITAGE COLLECTION</small></span></a><p>Engineering reference for automotive learning.</p><div class="footer-bottom"><span>© 2026 Classic Ford Collection</span><span>Built for automotive enthusiasts</span></div></footer>`;
export default function EngineeringPage() {
  return <><link rel="stylesheet" href="/carmodel/pages.css?v=20261122-common-navigation" /><LegacyPage markup={markup} /><VehicleSystemsExplorer /></>;
}
