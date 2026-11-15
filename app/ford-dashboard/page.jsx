import LegacyPage from "../components/LegacyPage";
import DashboardSidebar from "../components/DashboardSidebar";

const markup = `
<main class="page-shell inner-page ford-insight-dashboard dashboard-home">
  <section class="ford-dashboard-hero">
    <div><span class="eyebrow">CLASSIC FORD / KNOWLEDGE CENTRE</span><h1>Ford <em>reference workspace.</em></h1><p>Choose a workspace from the sidebar. Each section opens on its own dedicated page, keeping model browsing, vehicle comparison and engineering exploration clear and focused.</p></div>
    <div class="ford-dashboard-hero-mark"><span>F</span><small>HERITAGE<br/>DATA INDEX</small></div>
  </section>
  <section class="dashboard-launch-grid" aria-label="Ford workspace sections">
    <a class="dashboard-launch-card" href="/carmodel/models/"><span>01 / VISUAL DIRECTORY</span><div class="dashboard-launch-icon">▤</div><h2>Ford <em>models.</em></h2><p>Browse the Ford collection by vehicle category, view photographs and read model histories.</p><b>Open model gallery <i>↗</i></b></a>
    <a class="dashboard-launch-card" href="/carmodel/specifications/"><span>02 / VEHICLE DATA</span><div class="dashboard-launch-icon">⇄</div><h2>Specification <em>comparison.</em></h2><p>Select two Ford vehicles and compare their available engine, power, torque and drivetrain data.</p><b>Open comparison <i>↗</i></b></a>
    <a class="dashboard-launch-card" href="/carmodel/engineering/"><span>03 / TECHNICAL LIBRARY</span><div class="dashboard-launch-icon">⚙</div><h2>Engineering <em>systems.</em></h2><p>Explore the function, components, operating flow and inspection points of key vehicle systems.</p><b>Explore engineering <i>↗</i></b></a>
    <a class="dashboard-launch-card" href="/carmodel/factory/"><span>04 / MANUFACTURING</span><div class="dashboard-launch-icon">⌁</div><h2>Factory <em>process.</em></h2><p>Follow the vehicle manufacturing stages, process connections and production operations.</p><b>Open factory process <i>↗</i></b></a>
  </section>
  <section class="dashboard-home-note"><span class="eyebrow">A CLEARER WAY TO EXPLORE</span><h2>One workspace.<br/><em>Separate focused pages.</em></h2><p>Use the left navigation to move between sections. Selecting Comparison opens only the comparison workspace; it no longer sits below the model directory on one long dashboard page.</p></section>
</main>`;
export default function FordDashboardPage() {
  return <><link rel="stylesheet" href="/carmodel/pages.css?v=20261115-sidebar-workspace-1" /><LegacyPage markup={markup} /><DashboardSidebar /></>;
}
