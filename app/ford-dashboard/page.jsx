import LegacyPage from "../components/LegacyPage";
import ModelDialogs from "../components/ModelDialogs";
import ModelDirectory from "../components/ModelDirectory";
import VehicleSpecificationDashboard from "../components/VehicleSpecificationDashboard";
import VehicleSystemsExplorer from "../components/VehicleSystemsExplorer";
import FordAnalyticsDashboard from "../components/FordAnalyticsDashboard";

const markup = `
<main class="page-shell inner-page ford-insight-dashboard">
  <section class="ford-dashboard-hero">
    <div><span class="eyebrow">CLASSIC FORD / KNOWLEDGE CENTRE</span><h1>Ford <em>reference dashboard.</em></h1><p>Explore the same 11 selected Ford models, compare their representative specifications, and browse core automotive engineering systems in one organised workspace.</p></div>
    <div class="ford-dashboard-hero-mark"><span>F</span><small>HERITAGE<br/>DATA INDEX</small></div>
  </section>
  <section class="ford-dashboard-overview" aria-label="Dashboard overview">
    <a class="ford-overview-tile" href="#az-archive"><span>01 / DIRECTORY</span><strong>11</strong><small>Selected Ford models</small></a>
    <a class="ford-overview-tile" href="#spec-dashboard"><span>02 / COMPARISON</span><strong>11</strong><small>Historical reference configurations</small></a>
    <a class="ford-overview-tile" href="#vehicle-systems"><span>03 / ENGINEERING</span><strong>06</strong><small>Core vehicle systems explored</small></a>
  </section>
  <nav class="ford-dashboard-nav" aria-label="Dashboard sections"><a href="#az-archive">A–Z Directory <b>↘</b></a><a href="#spec-dashboard">Specification Comparison <b>↘</b></a><a href="#vehicle-systems">Engineering Reference <b>↘</b></a></nav>
  <section class="ford-dashboard-section directory-dashboard-section"><div class="ford-dashboard-section-heading"><span>01 / MODEL INDEX</span><h2>11 selected Ford <em>models.</em></h2><p>Browse the 11 reference models used throughout this dashboard. Open a model to see its details and available local 3D view.</p></div><div id="azArchiveMount"></div></section>
  <section class="ford-dashboard-section comparison-dashboard-section"><div class="ford-dashboard-section-heading"><span>02 / VEHICLE DATA</span><h2>Compare vehicle <em>specifications.</em></h2><p>Compare two reference configurations with separate visualisations for displacement, power and torque.</p></div><div id="specDashboardMount"></div><div id="specAnalyticsMount"></div></section>
  <section class="ford-dashboard-section engineering-dashboard-section"><div class="ford-dashboard-section-heading"><span>03 / TECHNICAL LIBRARY</span><h2>Engineering <em>systems reference.</em></h2><p>Explore how the major systems work, their key components, power flow and inspection points.</p></div><div id="vehicleSystemsMount"></div></section>
</main>`;
const scripts = ["/carmodel/scripts/local-3d-viewer.js"];
export default function FordDashboardPage() {
  return <>
    <link rel="stylesheet" href="/carmodel/pages.css?v=20261115-ford-dashboard-charts-v2" />
    <LegacyPage markup={markup} scripts={scripts} />
    <ModelDialogs />
    <ModelDirectory />
    <VehicleSpecificationDashboard />
    <FordAnalyticsDashboard />
    <VehicleSystemsExplorer />
  </>;
}
